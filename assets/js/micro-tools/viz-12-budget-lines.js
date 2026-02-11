/* Viz 12 — Budget Line Dynamics
   Three sliders (pX, pY, M), ghost original line, affordable region,
   intercept labels, inflation demo button, reset.                    */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var maxX = 25, maxY = 25;
    var initial = { pX: 5, pY: 5, M: 100 };
    var state = { pX: 5, pY: 5, M: 100 };

    var sliders = {};
    var sliderMax = { pX: 20, pY: 20, M: 200 };

    sliders.pX = MT.addSlider('controls-12', {
      label: 'Price of X (p\u2093)', min: 1, max: sliderMax.pX, value: 5, step: 0.5,
      format: function (v) { return '$' + v.toFixed(1); },
      onChange: function (v) { state.pX = v; update(); }
    });
    sliders.pY = MT.addSlider('controls-12', {
      label: 'Price of Y (p\u2094)', min: 1, max: sliderMax.pY, value: 5, step: 0.5,
      format: function (v) { return '$' + v.toFixed(1); },
      onChange: function (v) { state.pY = v; update(); }
    });
    sliders.M = MT.addSlider('controls-12', {
      label: 'Income (M)', min: 10, max: sliderMax.M, value: 100, step: 5,
      format: function (v) { return '$' + v.toFixed(0); },
      onChange: function (v) { state.M = v; update(); }
    });

    var doubleBtn = MT.addButton('controls-12', {
      label: 'Double All Prices & Income',
      onClick: function () {
        if (state.M * 2 > sliderMax.M || state.pX * 2 > sliderMax.pX || state.pY * 2 > sliderMax.pY) return;
        state.pX = state.pX * 2;
        state.pY = state.pY * 2;
        state.M = state.M * 2;
        sliders.pX.setValue(state.pX);
        sliders.pY.setValue(state.pY);
        sliders.M.setValue(state.M);
        update();
      }
    });

    MT.addButton('controls-12', {
      label: 'Reset',
      onClick: function () {
        state.pX = initial.pX; state.pY = initial.pY; state.M = initial.M;
        sliders.pX.setValue(state.pX);
        sliders.pY.setValue(state.pY);
        sliders.M.setValue(state.M);
        update();
      }
    });

    var chart, xScale, yScale, dynamicG;

    function setup() {
      chart = MT.createChart('chart-12', { height: 420 });
      xScale = d3.scaleLinear().domain([0, maxX]).range([0, chart.innerWidth]);
      yScale = d3.scaleLinear().domain([0, maxY]).range([chart.innerHeight, 0]);
    }

    function render() {
      setup();
      var colors = MT.getColors();
      MT.drawAxes(chart, xScale, yScale, 'Good X', 'Good Y', { xTicks: 10, yTicks: 10 });
      dynamicG = chart.plotArea.append('g');
      drawDynamic(colors);
    }

    function update() {
      if (!dynamicG) { render(); return; }
      dynamicG.selectAll('*').remove();
      drawDynamic(MT.getColors());
    }

    function drawDynamic(colors) {
      var intX = state.M / state.pX;
      var intY = state.M / state.pY;
      var origIntX = initial.M / initial.pX;
      var origIntY = initial.M / initial.pY;

      /* Ghost original budget line (if different) */
      if (Math.abs(state.pX - initial.pX) > 0.01 ||
          Math.abs(state.pY - initial.pY) > 0.01 ||
          Math.abs(state.M - initial.M) > 0.01) {
        MT.drawCurve(dynamicG,
          function (x) { return origIntY - (initial.pX / initial.pY) * x; },
          [0, Math.min(origIntX, maxX)], xScale, yScale,
          { color: colors.textLight, strokeWidth: 1.5, dashed: true });
      }

      /* Affordable region */
      var clippedIntX = Math.min(intX, maxX);
      var clippedIntY = Math.min(intY, maxY);
      MT.drawPoly(dynamicG, [
        [xScale(0), yScale(0)],
        [xScale(clippedIntX), yScale(0)],
        [xScale(clippedIntX), yScale(Math.max(0, intY - (state.pX / state.pY) * clippedIntX))],
        [xScale(0), yScale(clippedIntY)]
      ], { fill: colors.cs, opacity: 0.15 });

      /* Budget line */
      MT.drawCurve(dynamicG,
        function (x) { return intY - (state.pX / state.pY) * x; },
        [0, Math.min(intX, maxX)], xScale, yScale,
        { color: colors.demand, strokeWidth: 2.5 });

      /* Intercept labels */
      dynamicG.append('text')
        .attr('x', xScale(Math.min(intX, maxX))).attr('y', yScale(0) + 15)
        .attr('text-anchor', 'middle')
        .style('fill', colors.demand).style('font-size', '11px').style('font-weight', 'bold')
        .text('M/p\u2093=' + MT.fmt(intX, 1));
      dynamicG.append('text')
        .attr('x', xScale(0) - 5).attr('y', yScale(Math.min(intY, maxY)))
        .attr('text-anchor', 'end')
        .style('fill', colors.demand).style('font-size', '11px').style('font-weight', 'bold')
        .text('M/p\u2094=' + MT.fmt(intY, 1));

      /* Slope label */
      dynamicG.append('text')
        .attr('x', xScale(Math.min(intX, maxX) / 2)).attr('y', yScale(intY / 2) - 10)
        .attr('text-anchor', 'middle')
        .style('fill', colors.demand).style('font-size', '10px')
        .text('slope = \u2212' + MT.fmt(state.pX / state.pY, 2));

      /* Info */
      d3.select('#info-12').html(
        '<strong>Budget:</strong> ' + MT.fmt(state.pX, 1) + 'x + ' + MT.fmt(state.pY, 1) + 'y = ' + MT.fmt(state.M, 0) +
        '<br><strong>X-intercept:</strong> M/p\u2093 = ' + MT.fmt(intX, 1) +
        '<br><strong>Y-intercept:</strong> M/p\u2094 = ' + MT.fmt(intY, 1) +
        '<br><strong>Slope:</strong> \u2212p\u2093/p\u2094 = \u2212' + MT.fmt(state.pX / state.pY, 2)
      );

      MT.updateMath('math-12',
        MT.fmt(state.pX, 1) + 'x + ' + MT.fmt(state.pY, 1) + 'y = ' + MT.fmt(state.M, 0) +
        '\\quad\\Rightarrow\\quad y = ' + MT.fmt(intY, 1) + ' - ' + MT.fmt(state.pX / state.pY, 2) + 'x');
    }

    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
