/* ============================================================
   MicroTools Core — Shared utilities for interactive
   microeconomics visualizations (BUS 33001)
   ============================================================ */
window.MicroTools = (function () {
  'use strict';

  /* =================== Theme Colors =================== */

  function getColors() {
    var isDark =
      document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      bg:           isDark ? '#1C1C1D' : '#ffffff',
      text:         isDark ? '#d4d4d4' : '#000000',
      textLight:    isDark ? '#999999' : '#828282',
      grid:         isDark ? '#333338' : '#e2e2e2',
      axis:         isDark ? '#aaaaaa' : '#333333',
      demand:       '#2166ac',
      demandFaded:  isDark ? 'rgba(33,102,172,0.25)' : 'rgba(33,102,172,0.2)',
      supply:       '#800000',
      supplyFaded:  isDark ? 'rgba(128,0,0,0.25)' : 'rgba(128,0,0,0.2)',
      cs:           'rgba(33,102,172,0.30)',
      csStroke:     '#2166ac',
      ps:           'rgba(128,0,0,0.30)',
      psStroke:     '#800000',
      tax:          'rgba(0,171,55,0.35)',
      taxStroke:    '#00ab37',
      dwl:          'rgba(242,145,5,0.45)',
      dwlStroke:    '#F29105',
      social:       '#d6604d',
      socialFaded:  isDark ? 'rgba(214,96,77,0.25)' : 'rgba(214,96,77,0.2)',
      equilibrium:  '#C00000',
      priceLine:    '#F29105',
      highlight:    '#efcc00',
      positive:     '#00ab37',
      negative:     '#d6604d',
      revenue:      '#7b3294'
    };
  }

  /* =================== SVG Factory =================== */

  function createChart(containerId, opts) {
    opts = opts || {};
    var width  = opts.width  || 700;
    var height = opts.height || 450;
    var margin = opts.margin || { top: 30, right: 40, bottom: 55, left: 65 };

    var container = d3.select('#' + containerId);
    container.selectAll('svg').remove();

    var svg = container
      .append('svg')
      .attr('viewBox', '0 0 ' + width + ' ' + height)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .classed('micro-svg', true);

    var innerWidth  = width  - margin.left - margin.right;
    var innerHeight = height - margin.top  - margin.bottom;

    var defs = svg.append('defs');

    // clip path
    var clipId = 'clip-' + containerId;
    defs.append('clipPath')
      .attr('id', clipId)
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight);

    var plotArea = svg
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    return {
      svg: svg,
      defs: defs,
      plotArea: plotArea,
      width: width,
      height: height,
      margin: margin,
      innerWidth: innerWidth,
      innerHeight: innerHeight,
      clipId: clipId
    };
  }

  /* =================== Axes =================== */

  function drawAxes(chart, xScale, yScale, xLabel, yLabel, opts) {
    opts = opts || {};
    var colors = getColors();
    var xTicks = opts.xTicks != null ? opts.xTicks : 8;
    var yTicks = opts.yTicks != null ? opts.yTicks : 8;

    // grid
    if (opts.grid !== false) {
      chart.plotArea
        .append('g')
        .attr('class', 'grid-lines')
        .selectAll('line.hgrid')
        .data(yScale.ticks(yTicks))
        .join('line')
        .attr('x1', 0)
        .attr('x2', chart.innerWidth)
        .attr('y1', function (d) { return yScale(d); })
        .attr('y2', function (d) { return yScale(d); })
        .attr('stroke', colors.grid)
        .attr('stroke-dasharray', '2,3');

      chart.plotArea
        .select('.grid-lines')
        .selectAll('line.vgrid')
        .data(xScale.ticks(xTicks))
        .join('line')
        .attr('x1', function (d) { return xScale(d); })
        .attr('x2', function (d) { return xScale(d); })
        .attr('y1', 0)
        .attr('y2', chart.innerHeight)
        .attr('stroke', colors.grid)
        .attr('stroke-dasharray', '2,3');
    }

    // x-axis
    var xAxisG = chart.plotArea
      .append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', 'translate(0,' + chart.innerHeight + ')')
      .call(d3.axisBottom(xScale).ticks(xTicks));

    xAxisG.selectAll('text').style('fill', colors.axis).style('font-size', '11px');
    xAxisG.selectAll('line, path').style('stroke', colors.axis);

    // y-axis
    var yAxisG = chart.plotArea
      .append('g')
      .attr('class', 'axis y-axis')
      .call(d3.axisLeft(yScale).ticks(yTicks));

    yAxisG.selectAll('text').style('fill', colors.axis).style('font-size', '11px');
    yAxisG.selectAll('line, path').style('stroke', colors.axis);

    // labels
    if (xLabel) {
      chart.plotArea
        .append('text')
        .attr('class', 'axis-label')
        .attr('x', chart.innerWidth / 2)
        .attr('y', chart.innerHeight + 42)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text)
        .style('font-size', '13px')
        .text(xLabel);
    }

    if (yLabel) {
      chart.plotArea
        .append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -chart.innerHeight / 2)
        .attr('y', -48)
        .attr('text-anchor', 'middle')
        .style('fill', colors.text)
        .style('font-size', '13px')
        .text(yLabel);
    }
  }

  /* =================== Curve Drawing =================== */

  function drawCurve(plotArea, fn, xDomain, xScale, yScale, opts) {
    opts = opts || {};
    var n = opts.nPoints || 200;
    var step = (xDomain[1] - xDomain[0]) / n;
    var data = [];
    for (var x = xDomain[0]; x <= xDomain[1]; x += step) {
      var y = fn(x);
      if (y != null && isFinite(y)) data.push([x, y]);
    }

    var line = d3
      .line()
      .x(function (d) { return xScale(d[0]); })
      .y(function (d) { return yScale(d[1]); });

    return plotArea
      .append('path')
      .datum(data)
      .attr('class', opts.className || '')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', opts.color || getColors().demand)
      .attr('stroke-width', opts.strokeWidth || 2.5)
      .attr('stroke-dasharray', opts.dashed ? '8,5' : null)
      .attr('opacity', opts.opacity != null ? opts.opacity : 1);
  }

  /* =================== Filled Polygon =================== */

  function drawPoly(plotArea, screenPts, opts) {
    opts = opts || {};
    return plotArea
      .append('polygon')
      .attr('points', screenPts.map(function (p) { return p[0] + ',' + p[1]; }).join(' '))
      .attr('fill', opts.fill || 'rgba(0,0,0,0.15)')
      .attr('stroke', opts.stroke || 'none')
      .attr('stroke-width', opts.strokeWidth || 1)
      .attr('opacity', opts.opacity != null ? opts.opacity : 1)
      .attr('class', opts.className || '');
  }

  /* =================== Controls =================== */

  function addSlider(containerId, opts) {
    var container = d3.select('#' + containerId);
    var div = container.append('div').attr('class', 'micro-slider-group');

    var labelRow = div.append('div').attr('class', 'micro-slider-label');
    labelRow.append('span').text(opts.label);
    var valueSpan = labelRow
      .append('span')
      .attr('class', 'micro-slider-value')
      .text(opts.format ? opts.format(opts.value) : opts.value);

    var input = div
      .append('input')
      .attr('type', 'range')
      .attr('class', 'micro-slider')
      .attr('min', opts.min)
      .attr('max', opts.max)
      .attr('step', opts.step || 1)
      .attr('value', opts.value);

    input.on('input', function () {
      var val = +this.value;
      valueSpan.text(opts.format ? opts.format(val) : val);
      if (opts.onChange) opts.onChange(val);
    });

    return {
      input: input,
      setValue: function (v) {
        input.property('value', v);
        valueSpan.text(opts.format ? opts.format(v) : v);
      },
      getValue: function () {
        return +input.property('value');
      }
    };
  }

  function addDropdown(containerId, opts) {
    var container = d3.select('#' + containerId);
    var div = container.append('div').attr('class', 'micro-select-group');

    if (opts.label) {
      div.append('label').attr('class', 'micro-select-label').text(opts.label);
    }

    var select = div.append('select').attr('class', 'micro-select');

    opts.options.forEach(function (o) {
      select
        .append('option')
        .attr('value', o.value)
        .property('selected', o.value === opts.value)
        .text(o.label);
    });

    select.on('change', function () {
      if (opts.onChange) opts.onChange(this.value);
    });

    return {
      select: select,
      getValue: function () { return select.property('value'); },
      setValue: function (v) { select.property('value', v); }
    };
  }

  function addButton(containerId, opts) {
    var container = d3.select('#' + containerId);
    return container
      .append('button')
      .attr('class', 'micro-btn ' + (opts.className || ''))
      .text(opts.label)
      .on('click', opts.onClick);
  }

  function addToggle(containerId, opts) {
    var container = d3.select('#' + containerId);
    var div = container.append('div').attr('class', 'micro-toggle-group');

    var label = div.append('label').attr('class', 'micro-toggle-label');

    var input = label
      .append('input')
      .attr('type', 'checkbox')
      .property('checked', opts.checked || false);

    label.append('span').attr('class', 'micro-toggle-switch');
    label.append('span').attr('class', 'micro-toggle-text').text(opts.label);

    input.on('change', function () {
      if (opts.onChange) opts.onChange(this.checked);
    });

    return {
      input: input,
      getValue: function () { return input.property('checked'); },
      setValue: function (v) { input.property('checked', v); }
    };
  }

  /* =================== Equilibrium Solver =================== */

  // Q_D = dA + dB*P   (dB < 0)
  // Q_S = sA + sB*P   (sB > 0)
  function solveLinearEq(dA, dB, sA, sB) {
    var P = (dA - sA) / (sB - dB);
    var Q = dA + dB * P;
    return { P: P, Q: Q };
  }

  /* =================== Equilibrium Marker =================== */

  function addEqMarker(plotArea, xVal, yVal, xScale, yScale, opts) {
    opts = opts || {};
    var colors = getColors();
    var g = plotArea.append('g').attr('class', 'eq-marker');

    // dashed lines
    g.append('line')
      .attr('x1', xScale(xVal)).attr('y1', yScale(yVal))
      .attr('x2', xScale(xVal)).attr('y2', yScale(yScale.domain()[0]))
      .attr('stroke', opts.color || colors.equilibrium)
      .attr('stroke-dasharray', '5,3')
      .attr('stroke-width', 1);

    g.append('line')
      .attr('x1', xScale(xVal)).attr('y1', yScale(yVal))
      .attr('x2', xScale(xScale.domain()[0])).attr('y2', yScale(yVal))
      .attr('stroke', opts.color || colors.equilibrium)
      .attr('stroke-dasharray', '5,3')
      .attr('stroke-width', 1);

    // dot
    g.append('circle')
      .attr('cx', xScale(xVal))
      .attr('cy', yScale(yVal))
      .attr('r', opts.r || 5)
      .attr('fill', opts.color || colors.equilibrium);

    // labels
    if (opts.showLabels !== false) {
      g.append('text')
        .attr('x', xScale(xVal))
        .attr('y', yScale(yScale.domain()[0]) + 15)
        .attr('text-anchor', 'middle')
        .style('fill', opts.color || colors.equilibrium)
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .text(opts.xLabel || ('Q*=' + xVal.toFixed(1)));

      g.append('text')
        .attr('x', -8)
        .attr('y', yScale(yVal) + 4)
        .attr('text-anchor', 'end')
        .style('fill', opts.color || colors.equilibrium)
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .text(opts.yLabel || ('P*=' + yVal.toFixed(1)));
    }

    return g;
  }

  /* =================== Draggable Horizontal Price Line =================== */

  function addDraggablePriceLine(chart, yScale, opts) {
    opts = opts || {};
    var colors = getColors();
    var currentPrice = opts.initial != null ? opts.initial : yScale.domain()[1] / 2;

    var g = chart.plotArea.append('g').attr('class', 'price-line-group');

    var yPos = yScale(currentPrice);

    g.append('line')
      .attr('class', 'price-line')
      .attr('x1', 0).attr('x2', chart.innerWidth)
      .attr('y1', yPos).attr('y2', yPos)
      .attr('stroke', opts.color || colors.priceLine)
      .attr('stroke-width', 2.5);

    var handleW = 55, handleH = 22;
    g.append('rect')
      .attr('class', 'price-handle')
      .attr('x', chart.innerWidth - handleW)
      .attr('y', yPos - handleH / 2)
      .attr('width', handleW).attr('height', handleH)
      .attr('rx', 4)
      .attr('fill', opts.color || colors.priceLine);

    g.append('text')
      .attr('class', 'price-label')
      .attr('x', chart.innerWidth - handleW / 2)
      .attr('y', yPos + 4.5)
      .attr('text-anchor', 'middle')
      .style('fill', '#fff')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text(fmtPrice(currentPrice));

    // invisible wider hit area
    g.append('rect')
      .attr('class', 'price-hit')
      .attr('x', 0).attr('width', chart.innerWidth)
      .attr('y', yPos - 12).attr('height', 24)
      .attr('fill', 'transparent')
      .attr('cursor', 'ns-resize');

    function fmtPrice(p) {
      return opts.priceFormat ? opts.priceFormat(p) : 'P=' + p.toFixed(opts.decimals || 0);
    }

    function moveTo(price) {
      currentPrice = price;
      var y = yScale(price);
      g.select('.price-line').attr('y1', y).attr('y2', y);
      g.select('.price-handle').attr('y', y - handleH / 2);
      g.select('.price-label').attr('y', y + 4.5).text(fmtPrice(price));
      g.select('.price-hit').attr('y', y - 12);
    }

    var drag = d3.drag().on('drag', function (event) {
      var dom = yScale.domain();
      var p = yScale.invert(event.y);
      p = Math.max(dom[0], Math.min(dom[1], p));
      moveTo(p);
      if (opts.onDrag) opts.onDrag(p);
    });

    g.select('.price-hit').call(drag);
    g.select('.price-handle').call(drag);

    return {
      setPrice: moveTo,
      getPrice: function () { return currentPrice; },
      group: g
    };
  }

  /* =================== Theme Observer =================== */

  function onThemeChange(callback) {
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].attributeName === 'data-theme') {
          callback();
          return;
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true });
    return observer;
  }

  /* =================== MathJax Helpers =================== */

  function updateMath(elementId, latex) {
    var el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = '\\(' + latex + '\\)';
    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise([el]);
    }
  }

  /* =================== Number Formatting =================== */

  function fmt(n, d) {
    return Number(n).toFixed(d != null ? d : 1);
  }

  function fmtDollar(n) {
    return '$' + fmt(n, 2);
  }

  /* =================== Public API =================== */

  return {
    getColors:              getColors,
    createChart:            createChart,
    drawAxes:               drawAxes,
    drawCurve:              drawCurve,
    drawPoly:               drawPoly,
    addSlider:              addSlider,
    addDropdown:            addDropdown,
    addButton:              addButton,
    addToggle:              addToggle,
    solveLinearEq:          solveLinearEq,
    addEqMarker:            addEqMarker,
    addDraggablePriceLine:  addDraggablePriceLine,
    onThemeChange:          onThemeChange,
    updateMath:             updateMath,
    fmt:                    fmt,
    fmtDollar:              fmtDollar
  };
})();
