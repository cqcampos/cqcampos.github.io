/* Viz 1 — Coffee at Booth: Building a Demand Curve
   Slide model: 100 consumers #0–#99, person i has WTP = $i.
   Aggregate demand: Q_D = 100 − P.
   Also: Anne/Bob multi-unit table (toggle). */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var state = { price: 50, smooth: false };

    /* ---- Controls ---- */
    MT.addToggle('controls-01', {
      label: 'Show smooth demand curve',
      checked: false,
      onChange: function (v) { state.smooth = v; render(); }
    });

    var chart, xScale, yScale, barsG, curveG;

    function setup() {
      chart  = MT.createChart('chart-01');
      xScale = d3.scaleLinear().domain([0, 105]).range([0, chart.innerWidth]);
      yScale = d3.scaleLinear().domain([0, 105]).range([chart.innerHeight, 0]);
    }

    function render() {
      setup();
      var colors = MT.getColors();

      MT.drawAxes(chart, xScale, yScale, 'Quantity (students who buy)', 'Price / WTP ($)');

      barsG  = chart.plotArea.append('g');
      curveG = chart.plotArea.append('g');

      drawBars(colors);

      if (state.smooth) {
        MT.drawCurve(curveG, function (q) { return 100 - q; },
          [0, 100], xScale, yScale,
          { color: colors.demand, strokeWidth: 3 });
      }

      /* draggable price line */
      MT.addDraggablePriceLine(chart, yScale, {
        initial: state.price,
        onDrag: function (p) {
          state.price = p;
          barsG.selectAll('*').remove();
          drawBars(colors);
          updateInfo();
        }
      });

      updateInfo();
    }

    function drawBars(colors) {
      /* Person #i has WTP = $i.  Sort descending: bar 0 → WTP $99, bar 1 → $98, … */
      var barW = Math.max(1, (xScale(1) - xScale(0)) * 0.85);
      for (var i = 0; i < 100; i++) {
        var wtp = 99 - i;           // person ranked i-th from top
        var buying = wtp >= state.price;
        barsG.append('rect')
          .attr('x', xScale(i + 0.5) - barW / 2)
          .attr('y', yScale(wtp))
          .attr('width', barW)
          .attr('height', yScale(0) - yScale(wtp))
          .attr('fill', buying ? colors.demand : colors.grid)
          .attr('opacity', buying ? 0.65 : 0.35);
      }
    }

    function updateInfo() {
      var p  = state.price;
      var qd = Math.max(0, Math.min(100, Math.round(100 - p)));
      d3.select('#info-01').html(
        '<strong>Price:</strong> $' + p.toFixed(0) +
        '<br><strong>Buyers:</strong> ' + qd + ' students' +
        '<br><strong>Total spending:</strong> $' + (qd * p).toFixed(0)
      );
      MT.updateMath('math-01',
        'Q_D = 100 - P = 100 - ' + p.toFixed(0) + ' = ' + qd);
    }

    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
