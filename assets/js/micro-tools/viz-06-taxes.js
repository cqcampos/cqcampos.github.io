/* Viz 6 — Taxes: Where Does the Money Go?
   Slide model (Lecture 2):
     Q_D = 50 − 2P_D        (choke = 25)
     Q_S = 3P_S − 15         (floor = 5)
     No tax: P* = 13, Q* = 24, CS = 144, PS = 96, Total = 240
     Tax t = 5:  P_D = 16, P_S = 11, Q' = 18
                 CS = 81, PS = 54, Rev = 90, DWL = 15
   Toggle: tax on sellers vs buyers (same outcome).
   Mini-chart: DWL as function of t.                                */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var dA = 50, dB = -2;
    var sA = -15, sB = 3;
    var pChoke = -dA / dB;   // 25
    var pFloor = -sA / sB;   // 5
    var eq = MT.solveLinearEq(dA, dB, sA, sB); // P=13, Q=24

    var state = { tax: 5, taxOnSellers: true };
    var sliders = {};

    sliders.tax = MT.addSlider('controls-06', {
      label: 'Tax per unit (t)', min: 0, max: 20, value: 5, step: 0.5,
      format: function (v) { return '$' + v.toFixed(1); },
      onChange: function (v) { state.tax = v; update(); }
    });

    MT.addToggle('controls-06', {
      label: 'Tax levied on sellers (vs buyers)',
      checked: true,
      onChange: function (v) { state.taxOnSellers = v; update(); }
    });

    /* DWL mini-chart container */
    var dwlDiv = document.createElement('div');
    dwlDiv.id = 'chart-06-dwl';
    dwlDiv.className = 'micro-chart';
    document.getElementById('chart-06').parentNode.appendChild(dwlDiv);

    var chart, xScale, yScale, dynamicG;
    var dwlChart, dwlX, dwlY;

    function setup() {
      chart  = MT.createChart('chart-06', { height: 340 });
      xScale = d3.scaleLinear().domain([0, 55]).range([0, chart.innerWidth]);
      yScale = d3.scaleLinear().domain([0, 30]).range([chart.innerHeight, 0]);

      dwlChart = MT.createChart('chart-06-dwl', {
        height: 150, margin: { top: 15, right: 40, bottom: 48, left: 65 }
      });
      dwlX = d3.scaleLinear().domain([0, 20]).range([0, dwlChart.innerWidth]);
      dwlY = d3.scaleLinear().domain([0, 125]).range([dwlChart.innerHeight, 0]);
    }

    function render() {
      setup();
      var colors = MT.getColors();

      MT.drawAxes(chart, xScale, yScale, 'Quantity', 'Price ($)');

      /* Demand */
      MT.drawCurve(chart.plotArea,
        function (q) { return (dA - q) / (-dB); },
        [0, dA], xScale, yScale, { color: colors.demand, strokeWidth: 2.5 });

      /* Supply */
      var sMax = sA + sB * yScale.domain()[1];
      MT.drawCurve(chart.plotArea,
        function (q) { return (q - sA) / sB; },
        [Math.max(0, sA), Math.min(sMax, xScale.domain()[1])], xScale, yScale,
        { color: colors.supply, strokeWidth: 2.5 });

      chart.plotArea.append('text')
        .attr('x', xScale(dA - 2)).attr('y', yScale(0.8))
        .style('fill', colors.demand).style('font-size', '11px').style('font-weight', 'bold').text('D');
      chart.plotArea.append('text')
        .attr('x', xScale(Math.min(sMax - 1, 53))).attr('y', yScale(yScale.domain()[1] - 1))
        .style('fill', colors.supply).style('font-size', '11px').style('font-weight', 'bold').text('S');

      /* DWL mini-chart */
      MT.drawAxes(dwlChart, dwlX, dwlY, 'Tax rate ($)', 'DWL ($)', { xTicks: 5, yTicks: 4 });
      var dwlCoeff = 0.5 * Math.abs(dB) * sB / (sB - dB);
      MT.drawCurve(dwlChart.plotArea,
        function (t) { return dwlCoeff * t * t; },
        [0, 20], dwlX, dwlY, { color: colors.dwlStroke, strokeWidth: 2 });

      dynamicG = chart.plotArea.append('g');
      drawDynamic(colors);
    }

    function update() {
      if (!dynamicG) { render(); return; }
      dynamicG.selectAll('*').remove();

      /* DWL dot */
      var dwlCoeff = 0.5 * Math.abs(dB) * sB / (sB - dB);
      var dwlVal = dwlCoeff * state.tax * state.tax;
      dwlChart.plotArea.selectAll('.dwl-dot').remove();
      dwlChart.plotArea.append('circle').attr('class', 'dwl-dot')
        .attr('cx', dwlX(state.tax)).attr('cy', dwlY(dwlVal))
        .attr('r', 5).attr('fill', MT.getColors().dwlStroke);

      drawDynamic(MT.getColors());
    }

    function drawDynamic(colors) {
      var t = state.tax;
      var PD = (dA - sA + sB * t) / (sB - dB);
      var PS = PD - t;
      var Qt = Math.max(0, dA + dB * PD);

      /* Shifted curve (faded) */
      if (t > 0) {
        if (state.taxOnSellers) {
          MT.drawCurve(dynamicG,
            function (q) { return (q - sA) / sB + t; },
            [Math.max(0, sA), Math.min(sA + sB * (yScale.domain()[1] - t), xScale.domain()[1])],
            xScale, yScale, { color: colors.supplyFaded, strokeWidth: 1.5, dashed: true });
          dynamicG.append('text')
            .attr('x', xScale(5)).attr('y', yScale(pFloor + t + 0.5))
            .style('fill', colors.supplyFaded).style('font-size', '10px').text('S + tax');
        } else {
          MT.drawCurve(dynamicG,
            function (q) { return (dA - q) / (-dB) - t; },
            [0, dA], xScale, yScale, { color: colors.demandFaded, strokeWidth: 1.5, dashed: true });
          dynamicG.append('text')
            .attr('x', xScale(dA - 8)).attr('y', yScale(0.8))
            .style('fill', colors.demandFaded).style('font-size', '10px').text('D \u2212 tax');
        }
      }

      if (Qt > 0 && t > 0) {
        /* CS triangle */
        MT.drawPoly(dynamicG, [
          [xScale(0), yScale(pChoke)],
          [xScale(Qt), yScale(PD)],
          [xScale(0), yScale(PD)]
        ], { fill: colors.cs, stroke: colors.csStroke });

        /* PS triangle */
        MT.drawPoly(dynamicG, [
          [xScale(0), yScale(PS)],
          [xScale(Qt), yScale(PS)],
          [xScale(0), yScale(pFloor)]
        ], { fill: colors.ps, stroke: colors.psStroke });

        /* Tax revenue rectangle */
        MT.drawPoly(dynamicG, [
          [xScale(0), yScale(PD)],
          [xScale(Qt), yScale(PD)],
          [xScale(Qt), yScale(PS)],
          [xScale(0), yScale(PS)]
        ], { fill: colors.tax, stroke: colors.taxStroke });

        /* DWL triangle */
        MT.drawPoly(dynamicG, [
          [xScale(Qt), yScale(PD)],
          [xScale(eq.Q), yScale(eq.P)],
          [xScale(Qt), yScale(PS)]
        ], { fill: colors.dwl, stroke: colors.dwlStroke });

        /* Tax wedge bracket */
        var bx = xScale(Qt) + 8;
        dynamicG.append('line')
          .attr('x1', bx).attr('x2', bx)
          .attr('y1', yScale(PD)).attr('y2', yScale(PS))
          .attr('stroke', colors.taxStroke).attr('stroke-width', 2);
        dynamicG.append('text')
          .attr('x', bx + 5).attr('y', yScale((PD + PS) / 2) + 4)
          .style('fill', colors.taxStroke).style('font-size', '10px').style('font-weight', 'bold')
          .text('t=$' + MT.fmt(t, 0));

        /* Area labels */
        dynamicG.append('text').attr('x', xScale(Qt * 0.25)).attr('y', yScale((pChoke + PD) / 2))
          .attr('text-anchor', 'middle').style('fill', colors.csStroke).style('font-size', '10px').style('font-weight', 'bold').text('CS');
        dynamicG.append('text').attr('x', xScale(Qt * 0.25)).attr('y', yScale((PS + pFloor) / 2))
          .attr('text-anchor', 'middle').style('fill', colors.psStroke).style('font-size', '10px').style('font-weight', 'bold').text('PS');
        dynamicG.append('text').attr('x', xScale(Qt * 0.4)).attr('y', yScale((PD + PS) / 2) + 4)
          .attr('text-anchor', 'middle').style('fill', colors.taxStroke).style('font-size', '10px').style('font-weight', 'bold').text('Rev');
      }

      var CS = Qt > 0 ? 0.5 * Qt * (pChoke - PD) : 0;
      var PSval = Qt > 0 ? 0.5 * Qt * (PS - pFloor) : 0;
      var Rev = Qt * t;
      var DWL = 0.5 * (eq.Q - Qt) * (PD - PS);
      var note = state.taxOnSellers ? 'Tax on sellers' : 'Tax on buyers';

      d3.select('#info-06').html(
        '<strong>' + note + '</strong> \u2014 same economic outcome' +
        '<br><strong>P<sub>D</sub>:</strong> $' + MT.fmt(PD, 1) +
        '&ensp;<strong>P<sub>S</sub>:</strong> $' + MT.fmt(PS, 1) +
        '&ensp;<strong>Q\u2032:</strong> ' + MT.fmt(Qt, 1) +
        '<br><strong>CS:</strong> ' + MT.fmt(CS, 0) +
        '&ensp;<strong>PS:</strong> ' + MT.fmt(PSval, 0) +
        '&ensp;<strong style="color:' + colors.taxStroke + '">Rev:</strong> ' + MT.fmt(Rev, 0) +
        '&ensp;<strong style="color:' + colors.dwlStroke + '">DWL:</strong> ' + MT.fmt(DWL, 0)
      );

      var dwlCoeff = 0.5 * Math.abs(dB) * sB / (sB - dB);
      MT.updateMath('math-06',
        'P_D=' + MT.fmt(PD, 1) + ',\\;P_S=' + MT.fmt(PS, 1) +
        ',\\;Q\'=' + MT.fmt(Qt, 1) +
        ',\\;\\text{DWL} \\approx ' + MT.fmt(dwlCoeff, 2) + 't^2 = ' + MT.fmt(DWL, 1));
    }

    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
