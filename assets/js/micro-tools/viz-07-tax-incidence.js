/* Viz 7 — Who Bears the Tax?  Elasticity and Tax Incidence
   Consumer share = ε_S / (|ε_D| + ε_S)
   Producer share = |ε_D| / (|ε_D| + ε_S)
   Presets: Tobacco (inelastic D), Marlboro Golds (elastic D), Gasoline.
   Curves rotate around fixed equilibrium (Q0=30, P0=15).               */
(function () {
  'use strict';
  var MT = window.MicroTools;

  var presets = {
    tobacco:  { label: 'Tobacco',        eD: 0.3, eS: 1.0 },
    marlboro: { label: 'Marlboro Golds', eD: 3.0, eS: 1.0 },
    gas:      { label: 'Gasoline',       eD: 0.5, eS: 0.8 }
  };

  function init() {
    var state = { eD: 1.0, eS: 1.0, tax: 5 };
    var sliders = {};

    sliders.eD = MT.addSlider('controls-07', {
      label: 'Demand elasticity |ε_D|', min: 0.1, max: 5, value: 1, step: 0.1,
      format: function (v) { return v.toFixed(1); },
      onChange: function (v) { state.eD = v; update(); }
    });

    sliders.eS = MT.addSlider('controls-07', {
      label: 'Supply elasticity ε_S', min: 0.1, max: 5, value: 1, step: 0.1,
      format: function (v) { return v.toFixed(1); },
      onChange: function (v) { state.eS = v; update(); }
    });

    sliders.tax = MT.addSlider('controls-07', {
      label: 'Tax per unit (t)', min: 0, max: 10, value: 5, step: 0.5,
      format: function (v) { return '$' + v.toFixed(1); },
      onChange: function (v) { state.tax = v; update(); }
    });

    var presetDiv = d3.select('#controls-07').append('div').attr('class', 'micro-preset-group');
    presetDiv.append('span').attr('class', 'micro-preset-label').text('Presets: ');
    Object.keys(presets).forEach(function (k) {
      presetDiv.append('button')
        .attr('class', 'micro-btn micro-btn-sm')
        .text(presets[k].label)
        .on('click', function () {
          state.eD = presets[k].eD; state.eS = presets[k].eS;
          sliders.eD.setValue(state.eD); sliders.eS.setValue(state.eS);
          update();
        });
    });

    var P0 = 15, Q0 = 30;
    var chart, xScale, yScale, dynamicG;

    function setup() {
      chart  = MT.createChart('chart-07');
      xScale = d3.scaleLinear().domain([0, 65]).range([0, chart.innerWidth]);
      yScale = d3.scaleLinear().domain([0, 35]).range([chart.innerHeight, 0]);
    }

    function curvesFromElast() {
      var slopeD = -state.eD * Q0 / P0;
      var slopeS =  state.eS * Q0 / P0;
      return {
        dA: Q0 - slopeD * P0, dB: slopeD,
        sA: Q0 - slopeS * P0, sB: slopeS
      };
    }

    function render() {
      setup();
      var colors = MT.getColors();
      MT.drawAxes(chart, xScale, yScale, 'Quantity', 'Price ($)');
      dynamicG = chart.plotArea.append('g');
      drawDynamic(colors);
    }

    function update() {
      if (!dynamicG) { render(); return; }
      dynamicG.selectAll('*').remove();
      drawDynamic(MT.getColors());
    }

    function drawDynamic(colors) {
      var c = curvesFromElast();
      var t = state.tax;

      /* Demand */
      var dMax = Math.max(0, c.dA);
      MT.drawCurve(dynamicG,
        function (q) { return (c.dA - q) / (-c.dB); },
        [0, Math.min(dMax, xScale.domain()[1])], xScale, yScale,
        { color: colors.demand, strokeWidth: 2.5 });

      /* Supply */
      var sMin = Math.max(0, c.sA);
      var sMaxQ = c.sA + c.sB * yScale.domain()[1];
      MT.drawCurve(dynamicG,
        function (q) { return (q - c.sA) / c.sB; },
        [sMin, Math.min(sMaxQ, xScale.domain()[1])], xScale, yScale,
        { color: colors.supply, strokeWidth: 2.5 });

      dynamicG.append('text').attr('x', xScale(Math.min(dMax - 2, 62))).attr('y', yScale(0.8))
        .style('fill', colors.demand).style('font-size', '11px').style('font-weight', 'bold').text('D');
      dynamicG.append('text').attr('x', xScale(Math.min(sMaxQ - 1, 62))).attr('y', yScale(yScale.domain()[1] - 1))
        .style('fill', colors.supply).style('font-size', '11px').style('font-weight', 'bold').text('S');

      /* No-tax eq dot */
      dynamicG.append('circle')
        .attr('cx', xScale(Q0)).attr('cy', yScale(P0))
        .attr('r', 4).attr('fill', colors.textLight);

      if (t > 0) {
        var PD = (c.dA - c.sA + c.sB * t) / (c.sB - c.dB);
        var PS = PD - t;
        var Qt = Math.max(0, c.dA + c.dB * PD);

        if (Qt > 0) {
          /* Tax wedge */
          MT.drawPoly(dynamicG, [
            [xScale(0), yScale(PD)], [xScale(Qt), yScale(PD)],
            [xScale(Qt), yScale(PS)], [xScale(0), yScale(PS)]
          ], { fill: colors.tax, stroke: colors.taxStroke, opacity: 0.5 });

          /* Consumer burden (P0→PD) */
          dynamicG.append('rect')
            .attr('x', xScale(0)).attr('y', yScale(PD))
            .attr('width', xScale(Qt) - xScale(0))
            .attr('height', yScale(P0) - yScale(PD))
            .attr('fill', colors.csStroke).attr('opacity', 0.15);

          /* Producer burden (PS→P0) */
          dynamicG.append('rect')
            .attr('x', xScale(0)).attr('y', yScale(P0))
            .attr('width', xScale(Qt) - xScale(0))
            .attr('height', yScale(PS) - yScale(P0))
            .attr('fill', colors.psStroke).attr('opacity', 0.15);
        }

        MT.addEqMarker(dynamicG, Qt, PD, xScale, yScale, {
          xLabel: "Q'=" + MT.fmt(Qt, 1), yLabel: 'P_D=$' + MT.fmt(PD, 1), color: colors.demand
        });

        dynamicG.append('text').attr('x', -8).attr('y', yScale(PS) + 4).attr('text-anchor', 'end')
          .style('fill', colors.supply).style('font-size', '11px').style('font-weight', 'bold')
          .text('P_S=$' + MT.fmt(PS, 1));
        dynamicG.append('line')
          .attr('x1', 0).attr('x2', xScale(Qt))
          .attr('y1', yScale(PS)).attr('y2', yScale(PS))
          .attr('stroke', colors.supply).attr('stroke-dasharray', '4,3').attr('stroke-width', 1);
      }

      /* Incidence */
      var consShare = state.eS / (state.eD + state.eS);
      var prodShare = state.eD / (state.eD + state.eS);

      /* Stacked bar */
      var barX = chart.innerWidth - 50, barW = 30, barH = chart.innerHeight * 0.5, barTop = 30;
      dynamicG.append('rect').attr('x', barX).attr('y', barTop)
        .attr('width', barW).attr('height', barH * consShare)
        .attr('fill', colors.csStroke).attr('opacity', 0.6);
      dynamicG.append('rect').attr('x', barX).attr('y', barTop + barH * consShare)
        .attr('width', barW).attr('height', barH * prodShare)
        .attr('fill', colors.psStroke).attr('opacity', 0.6);
      dynamicG.append('text').attr('x', barX + barW / 2).attr('y', barTop + barH * consShare * 0.5 + 4)
        .attr('text-anchor', 'middle').style('fill', '#fff').style('font-size', '9px').style('font-weight', 'bold')
        .text(Math.round(consShare * 100) + '%');
      dynamicG.append('text').attr('x', barX + barW / 2).attr('y', barTop + barH * consShare + barH * prodShare * 0.5 + 4)
        .attr('text-anchor', 'middle').style('fill', '#fff').style('font-size', '9px').style('font-weight', 'bold')
        .text(Math.round(prodShare * 100) + '%');
      dynamicG.append('text').attr('x', barX + barW / 2).attr('y', barTop - 5)
        .attr('text-anchor', 'middle').style('fill', colors.text).style('font-size', '9px').text('Burden');

      d3.select('#info-07').html(
        '<strong>Consumer share:</strong> ' + (consShare * 100).toFixed(0) + '%' +
        '&ensp;<strong>Producer share:</strong> ' + (prodShare * 100).toFixed(0) + '%' +
        '<br><em>The more inelastic side bears more of the tax.</em>'
      );

      MT.updateMath('math-07',
        '\\text{Consumer share} = \\frac{\\varepsilon_S}{|\\varepsilon_D|+\\varepsilon_S} = ' +
        '\\frac{' + MT.fmt(state.eS, 1) + '}{' + MT.fmt(state.eD, 1) + '+' + MT.fmt(state.eS, 1) + '} = ' +
        MT.fmt(consShare, 2));
    }

    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
