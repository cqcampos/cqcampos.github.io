/* Viz 16 — The Monopolist's Problem: MR = MC
   Inverse demand: P(Q) = A − BQ   (default A=24, B=0.5)
   MR(Q) = A − 2BQ
   Cost: C(Q) = MC·Q + FC  (constant marginal cost)
   Monopoly: Q^m = (A−MC)/(2B), P^m = (A+MC)/2
   Efficient: Q^e = (A−MC)/B,   P^e = MC                         */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var state = { MC: 4, A: 24, B: 0.5, FC: 0, showEfficient: false };

    MT.addSlider('controls-16', {
      label: 'Marginal Cost (MC)', min: 0, max: 20, value: state.MC, step: 0.5,
      format: function (v) { return '$' + v.toFixed(1); },
      onChange: function (v) { state.MC = v; update(); }
    });

    MT.addSlider('controls-16', {
      label: 'Demand intercept (A)', min: 15, max: 50, value: state.A, step: 1,
      onChange: function (v) { state.A = v; render(); }
    });

    MT.addSlider('controls-16', {
      label: 'Fixed Cost (FC)', min: 0, max: 300, value: state.FC, step: 10,
      format: function (v) { return '$' + v; },
      onChange: function (v) { state.FC = v; update(); }
    });

    MT.addToggle('controls-16', {
      label: 'Show efficient outcome (P = MC)',
      checked: false,
      onChange: function (v) { state.showEfficient = v; update(); }
    });

    var chart, xScale, yScale, dynamicG;

    function setup() {
      var A = state.A, B = state.B;
      var qMax = A / B;
      chart  = MT.createChart('chart-16', { height: 400 });
      xScale = d3.scaleLinear().domain([0, qMax * 1.08]).range([0, chart.innerWidth]);
      yScale = d3.scaleLinear().domain([0, A * 1.08]).range([chart.innerHeight, 0]);
    }

    function render() {
      setup();
      var colors = MT.getColors();
      var A = state.A, B = state.B, qMax = A / B;

      MT.drawAxes(chart, xScale, yScale, 'Quantity (Q)', 'Price ($)');

      /* Demand */
      MT.drawCurve(chart.plotArea,
        function (q) { return A - B * q; },
        [0, qMax], xScale, yScale, { color: colors.demand, strokeWidth: 2.5 });
      chart.plotArea.append('text')
        .attr('x', xScale(qMax * 0.93)).attr('y', yScale(A * 0.04))
        .style('fill', colors.demand).style('font-size', '11px').style('font-weight', 'bold').text('D');

      /* MR */
      var qMR0 = A / (2 * B);
      MT.drawCurve(chart.plotArea,
        function (q) { return A - 2 * B * q; },
        [0, qMR0], xScale, yScale, { color: colors.revenue, strokeWidth: 2, dashed: true });
      chart.plotArea.append('text')
        .attr('x', xScale(qMR0 * 0.92)).attr('y', yScale(A * 0.04))
        .style('fill', colors.revenue).style('font-size', '11px').style('font-weight', 'bold').text('MR');

      dynamicG = chart.plotArea.append('g');
      drawDynamic(colors);
    }

    function update() {
      if (!dynamicG) { render(); return; }
      dynamicG.selectAll('*').remove();
      drawDynamic(MT.getColors());
    }

    function drawDynamic(colors) {
      var A = state.A, B = state.B, MC = state.MC, FC = state.FC;
      var qMax = A / B;

      /* MC line */
      dynamicG.append('line')
        .attr('x1', xScale(0)).attr('y1', yScale(MC))
        .attr('x2', xScale(qMax * 1.05)).attr('y2', yScale(MC))
        .attr('stroke', colors.supply).attr('stroke-width', 2);
      dynamicG.append('text')
        .attr('x', xScale(qMax * 1.03)).attr('y', yScale(MC) - 6)
        .style('fill', colors.supply).style('font-size', '11px').style('font-weight', 'bold').text('MC');

      if (MC >= A) {
        d3.select('#info-16').html('<strong>MC \u2265 A:</strong> No production profitable.');
        MT.updateMath('math-16', '\\text{MC} \\geq A \\implies Q^m = 0');
        return;
      }

      var Qm = (A - MC) / (2 * B);
      var Pm = (A + MC) / 2;
      var Qe = (A - MC) / B;
      var Pe = MC;

      /* CS triangle: above Pm, below demand, left of Qm */
      MT.drawPoly(dynamicG, [
        [xScale(0), yScale(A)],
        [xScale(Qm), yScale(Pm)],
        [xScale(0), yScale(Pm)]
      ], { fill: colors.cs, stroke: colors.csStroke });
      dynamicG.append('text')
        .attr('x', xScale(Qm * 0.25)).attr('y', yScale((A + Pm) / 2))
        .attr('text-anchor', 'middle')
        .style('fill', colors.csStroke).style('font-size', '10px').style('font-weight', 'bold').text('CS');

      /* Variable profit rectangle: between MC and Pm, width Qm */
      var varProfit = Qm * (Pm - MC);
      MT.drawPoly(dynamicG, [
        [xScale(0), yScale(Pm)],
        [xScale(Qm), yScale(Pm)],
        [xScale(Qm), yScale(MC)],
        [xScale(0), yScale(MC)]
      ], { fill: colors.ps, stroke: colors.psStroke });
      dynamicG.append('text')
        .attr('x', xScale(Qm / 2)).attr('y', yScale((Pm + MC) / 2) + 4)
        .attr('text-anchor', 'middle')
        .style('fill', colors.psStroke).style('font-size', '10px').style('font-weight', 'bold')
        .text(FC > 0 ? 'Rev \u2212 VC' : 'Profit');

      /* DWL triangle: between Qm and Qe, bounded by demand and MC */
      MT.drawPoly(dynamicG, [
        [xScale(Qm), yScale(Pm)],
        [xScale(Qe), yScale(MC)],
        [xScale(Qm), yScale(MC)]
      ], { fill: colors.dwl, stroke: colors.dwlStroke });
      dynamicG.append('text')
        .attr('x', xScale((2 * Qm + Qe) / 3)).attr('y', yScale((Pm + MC) / 2) + 4)
        .attr('text-anchor', 'middle')
        .style('fill', colors.dwlStroke).style('font-size', '10px').style('font-weight', 'bold').text('DWL');

      /* Monopoly eq marker */
      MT.addEqMarker(dynamicG, Qm, Pm, xScale, yScale, {
        color: colors.equilibrium,
        xLabel: 'Q\u1D50=' + MT.fmt(Qm, 1),
        yLabel: 'P\u1D50=$' + MT.fmt(Pm, 1),
        r: 5
      });

      /* Efficient outcome */
      if (state.showEfficient) {
        MT.addEqMarker(dynamicG, Qe, Pe, xScale, yScale, {
          color: colors.positive,
          xLabel: 'Q\u1D49=' + MT.fmt(Qe, 1),
          yLabel: 'P\u1D49=$' + MT.fmt(Pe, 1),
          r: 4
        });
      }

      /* Compute surplus values */
      var CS = 0.5 * Qm * (A - Pm);
      var Revenue = Qm * Pm;
      var Cost = MC * Qm + FC;
      var Profit = Revenue - Cost;
      var DWL = 0.5 * (Qe - Qm) * (Pm - MC);
      var noEntry = Profit < 0;

      /* No-entry overlay when fixed costs make profit negative */
      if (noEntry) {
        /* Dim the surplus areas */
        dynamicG.append('rect')
          .attr('x', 0).attr('y', 0)
          .attr('width', chart.innerWidth).attr('height', chart.innerHeight)
          .attr('fill', colors.bg).attr('opacity', 0.55);

        /* Big warning label */
        dynamicG.append('text')
          .attr('x', chart.innerWidth / 2).attr('y', chart.innerHeight * 0.35)
          .attr('text-anchor', 'middle')
          .style('fill', colors.negative).style('font-size', '20px').style('font-weight', 'bold')
          .text('Monopolist does not enter');
        dynamicG.append('text')
          .attr('x', chart.innerWidth / 2).attr('y', chart.innerHeight * 0.35 + 22)
          .attr('text-anchor', 'middle')
          .style('fill', colors.negative).style('font-size', '13px')
          .text('Profit = $' + MT.fmt(Profit, 0) + ' < 0 \u2014 fixed costs too high');
      }

      var html =
        '<strong>Monopoly pricing:</strong> Q\u1D50=' + MT.fmt(Qm, 1) + ', P\u1D50=$' + MT.fmt(Pm, 1) +
        '<br><strong>Revenue:</strong> $' + MT.fmt(Revenue, 0) +
        '&ensp;<strong>Cost:</strong> $' + MT.fmt(Cost, 0) +
        (FC > 0 ? ' (VC=$' + MT.fmt(MC * Qm, 0) + ' + FC=$' + MT.fmt(FC, 0) + ')' : '') +
        '&ensp;<strong>Profit:</strong> ' +
        (noEntry ? '<span style="color:' + colors.negative + ';font-weight:bold">$' + MT.fmt(Profit, 0) + ' \u2014 No entry!</span>' :
                   '$' + MT.fmt(Profit, 0)) +
        '<br><strong style="color:' + colors.csStroke + '">CS:</strong> ' + MT.fmt(CS, 0) +
        '&ensp;<strong style="color:' + colors.dwlStroke + '">DWL:</strong> ' + MT.fmt(DWL, 0);

      if (noEntry) {
        html += '<br><em style="color:' + colors.negative + '">MR = MC determines optimal price <strong>conditional on entry</strong>. ' +
          'With FC=$' + MT.fmt(FC, 0) + ', the monopolist earns negative profit and stays out.</em>';
      }

      if (state.showEfficient) {
        var CSe = 0.5 * Qe * (A - Pe);
        html += '<br><strong>Efficient:</strong> Q\u1D49=' + MT.fmt(Qe, 1) +
          ', P\u1D49=$' + MT.fmt(Pe, 1) +
          ', Total Surplus=$' + MT.fmt(CSe, 0) +
          ' (vs $' + MT.fmt(CS + Profit, 0) + ' + DWL)';
      }

      d3.select('#info-16').html(html);

      var mathLine1 = '\\text{MR}=\\text{MC}: ' + MT.fmt(A, 0) + '-2(' + MT.fmt(B, 1) + ')Q = ' + MT.fmt(MC, 1) +
        ' \\implies Q^m = ' + MT.fmt(Qm, 1) + ',\\; P^m = ' + MT.fmt(Pm, 1);
      if (FC > 0) {
        var mathLine2 = '\\pi = (P^m - MC)Q^m - FC = ' + MT.fmt(varProfit, 0) + '-' + MT.fmt(FC, 0) + ' = ' + MT.fmt(Profit, 0);
        var el = document.getElementById('math-16');
        if (el) {
          el.innerHTML = '\\(' + mathLine1 + '\\)<br>\\(' + mathLine2 + '\\)';
          if (window.MathJax && MathJax.typesetPromise) { MathJax.typesetPromise([el]); }
        }
      } else {
        MT.updateMath('math-16', mathLine1);
      }
    }

    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
