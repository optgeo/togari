const style = href => {
  const e = document.createElement('link')
  e.href = href
  e.rel = 'stylesheet'
  document.head.appendChild(e)
}

const script = src => {
  const e = document.createElement('script')
  e.src = src
  document.head.appendChild(e)
}

const init = () => {
  style('style.css')
  style('https://unpkg.com/maplibre-gl@2.1.9/dist/maplibre-gl.css')
  script('https://unpkg.com/maplibre-gl@2.1.9/dist/maplibre-gl.js')
}

init()

let map
const showMap = async (texts) => {
  const mapgl = maplibregl
  mapgl.accessToken = 
    'pk.eyJ1IjoiaGZ1IiwiYSI6ImNsM3FtcWVjZzBidWgza3A3ajZzdjlnZDAifQ.wTaURNl4e3NMZHbw50LupQ'
  map = new mapgl.Map({
    container: 'map',
    hash: true,
    style: 'style.json',
    maxZoom: 24,
  })
  map.addControl(new mapgl.NavigationControl())
  map.addControl(new mapgl.ScaleControl({
    maxWidth: 200, unit: 'metric'
  }))
  // thanks: https://github.com/maplibre/maplibre-gl-js/issues/1123
  map.getCameraPosition = () => {
    const pitch = map.transform._pitch
    const altitude = Math.cos(pitch) * map.transform.cameraToCenterDistance
    const latOffset = Math.tan(pitch) *
      map.transform.cameraToCenterDistance
    const latPosPointInPixels = map.transform.centerPoint.add(
      new mapgl.Point(0, latOffset))
    const latLong = map.transform.pointLocation(latPosPointInPixels)
    const verticalScaleConstant = map.transform.worldSize / (
      2 * Math.PI * 6378137 * 
      Math.abs(Math.cos(latLong.lat * (Math.PI / 180)))
    )
    const altitudeInMeters = altitude / verticalScaleConstant
    return {
      lng: latLong.lng, lat:latLong.lat,
      altitude: altitudeInMeters,
      pitch: pitch * 180 / Math.PI
    }
  }
  map.setCameraPosition = (camPos) => {
    const { lng, lat, altitude, pitch } = camPos
    const pitch_ = pitch * Math.PI / 180
    const cameraToCenterDistance = 0.5 / 
      Math.tan(map.transform._fov / 2) *
      map.transform.height
    const pixelAltitude = 
      Math.abs(Math.cos(pitch_) * cameraToCenterDistance)
    const metersInWorldAtLat = (
      2 * Math.PI * 6378137 * Math.abs(Math.cos(lat * (Math.PI / 180)))
    )
    const worldsize = (pixelAltitude / altitude) * metersInWorldAtLat
    const zoom = Math.log(worldsize / map.transform.tileSize) /
      Math.LN2
    const latOffset = Math.tan(pitch_) * cameraToCenterDistance
    const newPixelPoint = new mapgl.Point(
      map.transform.width / 2,
      map.transform.height / 2 + latOffset
    )
    const newLongLat = new mapgl.LngLat(lng, lat)
    map.transform.zoom = zoom
    map.transform.picth = pitch
    map.transform.setLocationAtPoint(newLongLat, newPixelPoint)
  }

  let voice = null
  for(let v of speechSynthesis.getVoices()) {
    console.log(v.name)
    if ([
      'Daniel',
      'Google UK English Male',
      'Microsoft Libby Online (Natural) - English (United Kingdom)'
    ].includes(v.name)) voice = v
  }

  const DELTA_BEARING = 15
  const DELTA_PITCH = 5
  const DELTA_Z = 0.4
  const DELTA_PAN = 120
  
  let easing = t => {
    return t * (2 - t)
  }

  map.on('load', () => {
    map.getCanvas().focus()
    map.getCanvas().addEventListener(
      'keydown',
      e => {
        // e.preventDefault()
        let c
        switch (e.key) {
          case 's': 
            c = map.getCameraPosition()
            c.altitude += 1000
            console.log('up: ' + JSON.stringify(c))
            map.setCameraPosition(c)
            break
          case 'd':
            c = map.getCameraPosition()
            c.altitude += 1000
            console.log('down: ' + JSON.stringify(c))
            map.setCameraPosition(c)
            break
          case 'a':
            map.rotateTo(
              map.getBearing() - DELTA_BEARING, { easing: easing }
            )
            break
          case 'f':
            map.rotateTo(
              map.getBearing() + DELTA_BEARING, { eaasing: easing }
            )
            break
          case ';':
            map.setPitch(map.getPitch() + DELTA_PITCH)
            break
          case 'g':
            map.setPitch(map.getPitch() - DELTA_PITCH)
            break
          case 'h':
            map.panBy([- DELTA_PAN, 0], { easing: easing })
            break
          case 'j':
            map.panBy([0, DELTA_PAN], { easing: easing })
            break
          case 'k':
            map.panBy([0, - DELTA_PAN], { easing: easing })
            break
          case 'l':
            map.panBy([DELTA_PAN, 0], { easing: easing })
            break
        }
      }
    )
  })
}

window.onload = () => {
  showMap()
}

