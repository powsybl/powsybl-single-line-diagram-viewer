import SldViewer from 'sld-svg/sld-viewer.js'
import metadata from './assets/diagrams/400.0_netherlands_metadata.json'
import svg from './assets/diagrams/400.0_netherlands.svg'
import arrow from './assets/icons/arrow.svg'
import arrowHover from './assets/icons/arrow-hover.svg'
import maximize from './assets/icons/maximize.svg'
import minimize from './assets/icons/minimize.svg'
import fetchAndDecode from './utils'

async function fetchRessources () {
  const substation = await fetchAndDecode(svg)

  const arrowIcon = await fetchAndDecode(arrow)
  const arrowHoverIcon = await fetchAndDecode(arrowHover)
  const maximizeIcon = await fetchAndDecode(maximize)
  const minimizeIcon = await fetchAndDecode(minimize)

  return {
    substation,
    arrowIcon,
    arrowHoverIcon,
    maximizeIcon,
    minimizeIcon
  }
}

async function setupSubstation ({
  substation,
  arrowIcon,
  arrowHoverIcon,
  maximizeIcon,
  minimizeIcon
}) {
  const sldsvg = new SldViewer()
    .addTo('sld-container')
    .size(700, 700)
    .viewbox(0, 0, 700, 700)
    .svg(substation, metadata)
    .panZoom({
      panning: true,
      zoomMin: 0.5,
      zoomMax: 20,
      zoomFactor: 0.2,
      margins: { top: 100, left: 100, right: 100, bottom: 100 }
    })

  sldsvg.addCallbackOnSwitches((switchId, open, target) => {
    console.log(`Click on switch - switchId: ${switchId}, open: ${open} target: ${target}`)
  })

  sldsvg.addNavigationArrows(
    {
      arrowIcon,
      arrowHoverIcon,
      backgroundColor: '#8BE8CB',
      backgroundHoverColor: '#61C9A8',
      xOffset: 22,
      yOffset: 65
    },
    (nextVId) => {
      console.log(`Click on arrow - nextVId: ${nextVId}`)
    })

  sldsvg.addMaximize(
    'svg-container',
    'maximize-container',
    {
      maximizeIcon,
      minimizeIcon,
      iconWidth: 24,
      iconHeight: 24,
      rightOffset: 5,
      bottomOffset: 5
    }
  )
}

fetchRessources()
  .then(ressources => {
    setupSubstation(ressources)
      .then()
      .catch(e => console.log)
  })
  .catch(e => console.log)
