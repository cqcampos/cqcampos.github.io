/* Viz 17 — Cake Factory: Cost Minimization Across Technologies
   Three production technologies for baking Q cakes:
   Hand:  C = ingredient*Q + 0        + (1/2)*Q*wage
   Mixer: C = ingredient*Q + mixerCap + (1/4)*Q*wage
   Robot: C = ingredient*Q + robotCap + (1/100)*Q*wage
   Lower envelope = min of three. Crossover where adjacent lines meet.  */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var state = { Q: 100, wage: 10, ingredient: 2 };
    var mixerCap = 100, robotCap = 1000;

    MT.addSlider('controls-17', {
      label: 'Quantity (Q)', min: 0, max: 600, value: state.Q, step: 5,
      onChange: function (v) { state.Q = v; update(); }
    });

    MT.addSlider('controls-17', {
      label: 'Wage ($/hr)', min: 5, max: 30, value: state.wage, step: 1,
      format: function (v) { return '$' + v; },
      onChange: function (v) { state.wage = v; render(); }
    });

    MT.addSlider('controls-17', {
      label: 'Ingredient cost ($/cake)', min: 1, max: 10, value: state.ingredient, step: 0.5,
      format: function (v) { return '$' + v.toFixed(1); },
      onChange: function (v) { state.ingredient = v; render(); }
    });

    var chart, xScale, yScale, dynamicG;

    /* Cost functions */
    function mcHand()  { return state.ingredient + 0.5 * state.wage; }
    function mcMixer() { return state.ingredient + 0.25 * state.wage; }
    function mcRobot() { return state.ingredient + 0.01 * state.wage; }
    function cHand(q)  { return mcHand() * q; }
    function cMixer(q) { return mcMixer() * q + mixerCap; }
    function cRobot(q) { return mcRobot() * q + robotCap; }

    /* Crossover points */
    function crossHandMixer() {
      var d = mcHand() - mcMixer();
      return d > 0 ? mixerCap / d : Infinity;
    }
    function crossMixerRobot() {
      var d = mcMixer() - mcRobot();
      return d > 0 ? (robotCap - mixerCap) / d : Infinity;
    }

    function setup() {
      var qMax = 600;
      var cMax = Math.max(cHand(qMax), cMixer(qMax), cRobot(qMax)) * 1.05;
      chart  = MT.createChart('chart-17', { height: 420 });
      xScale = d3.scaleLinear().domain([0, qMax]).range([0, chart.innerWidth]);
      yScale = d3.scaleLinear().domain([0, cMax]).range([chart.innerHeight, 0]);
    }

    function render() {
      setup();
      var colors = MT.getColors();
      var qMax = 600;

      MT.drawAxes(chart, xScale, yScale, 'Quantity (Q cakes)', 'Total Cost ($)', { xTicks: 6, yTicks: 6 });

      var colHand  = colors.demand;
      var colMixer = colors.supply;
      var colRobot = colors.revenue;

      /* Three cost lines */
      MT.drawCurve(chart.plotArea, cHand,  [0, qMax], xScale, yScale, { color: colHand,  strokeWidth: 2 });
      MT.drawCurve(chart.plotArea, cMixer, [0, qMax], xScale, yScale, { color: colMixer, strokeWidth: 2 });
      MT.drawCurve(chart.plotArea, cRobot, [0, qMax], xScale, yScale, { color: colRobot, strokeWidth: 2 });

      /* Labels at right edge */
      var yOff = -6;
      chart.plotArea.append('text')
        .attr('x', xScale(qMax) + 4).attr('y', yScale(cHand(qMax)) + yOff)
        .style('fill', colHand).style('font-size', '11px').style('font-weight', 'bold').text('Hand');
      chart.plotArea.append('text')
        .attr('x', xScale(qMax) + 4).attr('y', yScale(cMixer(qMax)) + yOff)
        .style('fill', colMixer).style('font-size', '11px').style('font-weight', 'bold').text('Mixer');
      chart.plotArea.append('text')
        .attr('x', xScale(qMax) + 4).attr('y', yScale(cRobot(qMax)) + yOff)
        .style('fill', colRobot).style('font-size', '11px').style('font-weight', 'bold').text('Robot');

      /* Lower envelope (bold) */
      var qHM = crossHandMixer();
      var qMR = crossMixerRobot();

      /* Build piecewise segments */
      var envelopePts = [];
      var step = 1;
      for (var q = 0; q <= qMax; q += step) {
        var best;
        if (q <= qHM) best = cHand(q);
        else if (q <= qMR) best = cMixer(q);
        else best = cRobot(q);
        envelopePts.push([q, best]);
      }

      var envLine = d3.line()
        .x(function (d) { return xScale(d[0]); })
        .y(function (d) { return yScale(d[1]); });

      chart.plotArea.append('path')
        .datum(envelopePts)
        .attr('d', envLine)
        .attr('fill', 'none')
        .attr('stroke', colors.equilibrium)
        .attr('stroke-width', 4)
        .attr('opacity', 0.7);

      /* Shaded optimal regions */
      var bandAlpha = 0.07;
      if (qHM > 0 && qHM <= qMax) {
        chart.plotArea.append('rect')
          .attr('x', xScale(0)).attr('y', 0)
          .attr('width', xScale(Math.min(qHM, qMax)) - xScale(0))
          .attr('height', chart.innerHeight)
          .attr('fill', colHand).attr('opacity', bandAlpha);
      }
      if (qHM < qMax && qMR > qHM) {
        chart.plotArea.append('rect')
          .attr('x', xScale(qHM)).attr('y', 0)
          .attr('width', xScale(Math.min(qMR, qMax)) - xScale(qHM))
          .attr('height', chart.innerHeight)
          .attr('fill', colMixer).attr('opacity', bandAlpha);
      }
      if (qMR < qMax) {
        chart.plotArea.append('rect')
          .attr('x', xScale(qMR)).attr('y', 0)
          .attr('width', xScale(qMax) - xScale(qMR))
          .attr('height', chart.innerHeight)
          .attr('fill', colRobot).attr('opacity', bandAlpha);
      }

      /* Crossover vertical dashed lines */
      if (qHM > 0 && qHM <= qMax) {
        chart.plotArea.append('line')
          .attr('x1', xScale(qHM)).attr('y1', 0)
          .attr('x2', xScale(qHM)).attr('y2', chart.innerHeight)
          .attr('stroke', colors.text).attr('stroke-width', 1.2).attr('stroke-dasharray', '6,4');
        chart.plotArea.append('text')
          .attr('x', xScale(qHM)).attr('y', -4)
          .attr('text-anchor', 'middle')
          .style('fill', colors.text).style('font-size', '10px')
          .text('Switch to Mixer (Q=' + MT.fmt(qHM, 0) + ')');
      }
      if (qMR > 0 && qMR <= qMax) {
        chart.plotArea.append('line')
          .attr('x1', xScale(qMR)).attr('y1', 0)
          .attr('x2', xScale(qMR)).attr('y2', chart.innerHeight)
          .attr('stroke', colors.text).attr('stroke-width', 1.2).attr('stroke-dasharray', '6,4');
        chart.plotArea.append('text')
          .attr('x', xScale(qMR)).attr('y', -4)
          .attr('text-anchor', 'middle')
          .style('fill', colors.text).style('font-size', '10px')
          .text('Switch to Robot (Q=' + MT.fmt(qMR, 0) + ')');
      }

      dynamicG = chart.plotArea.append('g');
      drawDynamic(colors);
    }

    function update() {
      if (!dynamicG) { render(); return; }
      dynamicG.selectAll('*').remove();
      drawDynamic(MT.getColors());
    }

    function drawDynamic(colors) {
      var Q = state.Q;
      var ch = cHand(Q), cm = cMixer(Q), cr = cRobot(Q);
      var best = Math.min(ch, cm, cr);
      var bestName;
      if (best === ch) bestName = 'Hand';
      else if (best === cm) bestName = 'Mixer';
      else bestName = 'Robot';

      var colHand  = colors.demand;
      var colMixer = colors.supply;
      var colRobot = colors.revenue;

      /* Dots on each line */
      dynamicG.append('circle')
        .attr('cx', xScale(Q)).attr('cy', yScale(ch))
        .attr('r', 4).attr('fill', colHand);
      dynamicG.append('circle')
        .attr('cx', xScale(Q)).attr('cy', yScale(cm))
        .attr('r', 4).attr('fill', colMixer);
      dynamicG.append('circle')
        .attr('cx', xScale(Q)).attr('cy', yScale(cr))
        .attr('r', 4).attr('fill', colRobot);

      /* Highlight the minimum with a larger ring */
      dynamicG.append('circle')
        .attr('cx', xScale(Q)).attr('cy', yScale(best))
        .attr('r', 7).attr('fill', 'none')
        .attr('stroke', colors.equilibrium).attr('stroke-width', 2.5);

      /* Vertical dashed at Q */
      dynamicG.append('line')
        .attr('x1', xScale(Q)).attr('y1', yScale(0))
        .attr('x2', xScale(Q)).attr('y2', yScale(best))
        .attr('stroke', colors.equilibrium).attr('stroke-width', 1.5).attr('stroke-dasharray', '4,3');

      /* Info panel */
      var qHM = crossHandMixer();
      var qMR = crossMixerRobot();
      var html =
        '<strong>At Q=' + MT.fmt(Q, 0) + ':</strong>' +
        '<br><span style="color:' + colHand + '">\u25A0 Hand:</span> $' + MT.fmt(ch, 0) +
        '&ensp;<span style="color:' + colMixer + '">\u25A0 Mixer:</span> $' + MT.fmt(cm, 0) +
        '&ensp;<span style="color:' + colRobot + '">\u25A0 Robot:</span> $' + MT.fmt(cr, 0) +
        '<br><strong>Optimal:</strong> ' + bestName + ' &mdash; C(Q) = $' + MT.fmt(best, 0) +
        '<br><strong>Crossovers:</strong> Hand\u2192Mixer at Q=' + (qHM <= 600 ? MT.fmt(qHM, 0) : '\u221E') +
        ', Mixer\u2192Robot at Q=' + (qMR <= 600 ? MT.fmt(qMR, 0) : '\u221E');
      if (state.wage !== 10) {
        html += '<br>At default wage ($10): crossovers at Q=40 and Q=375.';
      }
      html += '<br><em>\u2191 Wage \u2192 switch to machines sooner. ' +
        'Ingredient cost affects all technologies equally, so only the wage drives the switch points.</em>';
      d3.select('#info-17').html(html);

      /* Math */
      var mch  = mcHand(), mcm = mcMixer(), mcr = mcRobot();
      var el = document.getElementById('math-17');
      if (el) {
        el.innerHTML =
          '\\(C_{\\text{hand}}(Q) = ' + MT.fmt(mch, 1) + 'Q\\)' +
          '&emsp;\\(C_{\\text{mixer}}(Q) = ' + MT.fmt(mcm, 1) + 'Q + ' + mixerCap + '\\)' +
          '&emsp;\\(C_{\\text{robot}}(Q) = ' + MT.fmt(mcr, 2) + 'Q + ' + robotCap + '\\)';
        if (window.MathJax && MathJax.typesetPromise) { MathJax.typesetPromise([el]); }
      }
    }

    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
