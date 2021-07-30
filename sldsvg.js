/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { SVG } from '@svgdotjs/svg.js'
import '@svgdotjs/svg.panzoom.js'

const LEFT_BUTTON = 0
const COMPONENT_TYPES = new Set([
  'BREAKER',
  'DISCONNECTOR',
  'LOAD_BREAK_SWITCH'
])

export default class SldSvg {
  constructor () {
    this.canvas = SVG()
    this.isMaximized = false
    this.metadata = null
    this.initialViewbox = null
  }

  addTo (containerId) {
    this.canvas.addTo('#'.concat(containerId))

    return this
  }

  size (width, height) {
    this.canvas.size(width, height)

    return this
  }

  viewbox (x, y, width, height) {
    this.canvas.viewbox(x, y, width, height)
    this.initialViewbox = { x, y, width, height }

    return this
  }

  svg (svg, metadata) {
    this.metadata = metadata
    this.canvas.svg(svg)

    const svgElement = this.canvas.findOne('svg')
    svgElement.attr('style', 'overflow: visible')

    return this
  }

  panZoom (options) {
    this.canvas.panZoom({
      panning: options.panning,
      zoomMin: options.zoomMin,
      zoomMax: options.zoomMax,
      zoomFactor: options.zoomFactor,
      margins: options.margins
    })

    this.canvas.on('panStart', () => {
      this.canvas.attr('style', 'cursor: move')
    })
    this.canvas.on('panEnd', () => {
      this.canvas.attr('style', 'cursor: default')
    })

    return this
  }

  addCallbackOnSwitches (callback) {
    const switches = this.metadata.nodes.filter(
      element => COMPONENT_TYPES.has(element.componentType)
    )

    switches.forEach(s => {
      const element = SVG(document.getElementById(s.id))

      const switchId = s.equipmentId
      const open = s.open

      element.attr('style', 'cursor: pointer')

      this.fireIfNotDragged(element, (event) => {
        callback(switchId, !open, event.currentTarget)
      })
    })
  }

  addNavigationArrows (arrowStyle, callback) {
    let navigables = this.metadata.nodes.filter(
      element => element.nextVId !== null
    )

    let vlList = this.metadata.nodes.map((element) => element.vid)
    vlList = vlList.filter(
      (element, index) => element !== '' && vlList.indexOf(element) === index
    )

    navigables = navigables.filter((element) => {
      return vlList.indexOf(element.nextVId) === -1
    })

    navigables.forEach(element => {
      const position = this.getArrowPosition(element)

      this.createNavigationArrow(
        element,
        arrowStyle,
        callback,
        element.direction,
        position
      )
    })
  }

  addMaximize (svgContainerId, maximizeContainerId, maximizeStyle) {
    const maximizeIconCanvas = this.setMaximizeIcons(svgContainerId, maximizeStyle)
    const maximizeIcons = maximizeIconCanvas.children()

    const svgContainer = document.getElementById(svgContainerId)
    const maximizeContainer = document.getElementById(maximizeContainerId)
    const initialDimensions = this.getElementDimensions(svgContainer)
    const maximizedDimensions = this.getElementDimensions(maximizeContainer)

    maximizeIconCanvas.click(() => {
      this.toggleMaximize(
        svgContainer,
        maximizeIcons,
        initialDimensions,
        maximizedDimensions
      )
    })
  }

  setMaximizeIcons (svgContainerId, maximizeStyle) {
    const {
      maximizeIcon,
      minimizeIcon,
      iconWidth: width,
      iconHeight: height,
      rightOffset,
      bottomOffset
    } = maximizeStyle

    const maximizeIconCanvas = SVG()
    maximizeIconCanvas.addTo('#'.concat(svgContainerId))
      .size(width, height)
      .viewbox(0, 0, width, height)

    const maximize = SVG(maximizeIcon)
    const minimize = SVG(minimizeIcon)

    maximize.size(width, height)
    minimize.size(width, height)
    minimize.attr('visibility', 'hidden')

    maximizeIconCanvas.add(maximize)
    maximizeIconCanvas.add(minimize)

    document.getElementById(svgContainerId).style.position = 'relative'
    maximizeIconCanvas.attr('style', `position: absolute; 
      bottom: ${bottomOffset}px; 
      right: ${rightOffset}px; 
      cursor: pointer;`)

    return maximizeIconCanvas
  }

  toggleMaximize (
    svgContainer,
    [maximizeIcon, minimizeIcon],
    { w: initialWidth, h: initialHeight },
    { w: maxWidth, h: maxHeight }
  ) {
    this.canvas.viewbox(this.initialViewbox)

    if (this.isMaximized) {
      this.canvas.size(initialWidth, initialHeight)
      this.setElementDimensions(svgContainer, initialWidth, initialHeight)
      maximizeIcon.attr('visibility', 'visible')
      minimizeIcon.attr('visibility', 'hidden')
    } else {
      this.canvas.size(maxWidth, maxHeight)
      this.setElementDimensions(svgContainer, maxWidth, maxHeight)
      maximizeIcon.attr('visibility', 'hidden')
      minimizeIcon.attr('visibility', 'visible')
    }

    this.isMaximized = !this.isMaximized
  }

  getElementDimensions (element) {
    const w = element.offsetWidth
    const h = element.offsetHeight

    return { w, h }
  }

  setElementDimensions (element, width, height) {
    element.setAttribute('style', `width: ${width}px; height: ${height}px`)
  }

  getArrowPosition (element) {
    const position = {}

    const transform = SVG('#'.concat(element.id)).attr('transform').split(',')

    position.x = parseInt(transform[0].match(/\d+/))

    const y = parseInt(transform[1].match(/\d+/))
    if (position.lowestY === undefined || y < position.lowestY) {
      position.lowestY = y
    }
    if (position.highestY === undefined || y > position.highestY) {
      position.highestY = y
    }

    return position
  }

  createNavigationArrow (element, arrowStyle, callback, direction, position) {
    const parent = SVG('#'.concat(element.id)).parent()
    const group = SVG('<g>')
    const {
      arrowIcon,
      arrowHoverIcon,
      backgroundColor,
      backgroundHoverColor,
      xOffset,
      yOffset
    } = arrowStyle

    const arrow = SVG(arrowIcon)
    const arrowHover = SVG(arrowHoverIcon)

    this.setNavigationArrowPosition(group, direction, position, xOffset, yOffset)

    group.add(arrowHover)
    group.add(arrow)
    parent.add(group)

    this.fireIfNotDragged(group, () => {
      callback(element.nextVId)
    })

    group.on('mouseenter', (event) => {
      const pathElement = group.find('path')
      pathElement[0].attr('fill', backgroundHoverColor)
    })

    group.on('mouseleave', (event) => {
      const pathElement = group.find('path')
      pathElement[0].attr('fill', backgroundColor)
    })
  }

  setNavigationArrowPosition (group, direction, position, xOffset, yOffset) {
    let x = position.x
    let y
    if (direction === 'TOP') {
      y = position.lowestY - yOffset
      x -= xOffset
    } else {
      y = position.highestY + yOffset
      x += xOffset
    }

    if (direction === 'BOTTOM') {
      group.attr('transform', `translate(${x}, ${y}) rotate(180)`)
    } else {
      group.attr('transform', `translate(${x}, ${y})`)
    }
  }

  fireIfNotDragged (element, callback) {
    let dragged = false
    let isMouseDown = false
    element.mousedown(() => {
      dragged = false
      isMouseDown = true
    })
    element.mousemove(() => {
      dragged = true

      if (isMouseDown) {
        element.attr('style', 'cursor: move')
      } else {
        element.attr('style', 'cursor: pointer')
      }
    })
    element.mouseup((event) => {
      isMouseDown = false
      element.attr('style', 'cursor: pointer')

      if (dragged || event.button !== LEFT_BUTTON) {
        return
      }

      callback(event)
    })
  }
}
