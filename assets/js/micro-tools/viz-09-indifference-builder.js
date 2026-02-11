/* Viz 9 — Indifference Curve Builder
   Lecture 3: Consumer Theory
   Draggable reference basket on grid; dots colored by utility comparison.
   Utility types: Cobb-Douglas U=xy, Perfect Subs U=x+y, Perfect Comp U=min(x,y).
*/
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var maxX = 20, maxY = 20;
    var state = {
      refX: 10, refY: 10,
      utilType: 'cobb-douglas',
      showMultiple: false
    };

    MT.addDropdown('controls-09', {
      label: 'Utility function',
      value: 'cobb-douglas',
      options: [
        { value: 'cobb-douglas', label: 'Cobb-Douglas: U = xy' },
        { value: 'perfect-subs', label: 'Perfect Substitutes: U = x + y' },
        { value: 'perfect-comp', label: 'Perfect Complements: U = min(x, y)' }
      ],
      onChange: function (v) { state.utilType = v; update(); }
    });

    MT.addToggle('controls-09', {
      label: 'Show multiple indifference curves',
      checked: false,
      onChange: function (v) { state.showMultiple = v; update(); }
    });

    var chart, xScale, yScale, dynamicG;

    function utilFn(x, y) {
      if (state.utilType === 'cobb-douglas') return x * y;
      if (state.utilType === 'perfect-subs') return x + y;
      return Math.min(x, y);
    }

    function setup() {
      chart = MT.createChart('chart-09', { height: 420 });
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
      var refU = utilFn(state.refX, state.refY);

      /* Grid dots colored by utility comparison */
      for (var gx = 1; gx <= maxX; gx++) {
        for (var gy = 1; gy <= maxY; gy++) {
          var u = utilFn(gx, gy);
          var col;
          if (Math.abs(u - refU) < 0.01 * refU + 0.01) col = colors.highlight;
          else if (u > refU) col = colors.positive;
          else col = colors.negative;
          dynamicG.append('circle')
            .attr('cx', xScale(gx)).attr('cy', yScale(gy))
            .attr('r', 4).attr('fill', col).attr('opacity', 0.6);
        }
      }

      /* IC through reference point */
      drawIC(dynamicG, refU, colors.demand, 2.5);

      /* Additional ICs */
      if (state.showMultiple) {
        var levels = [refU * 0.3, refU * 0.6, refU * 1.5, refU * 2.0];
        for (var i = 0; i < levels.length; i++) {
          if (levels[i] > 0) drawIC(dynamicG, levels[i], colors.demand, 1.2);
        }
      }

      /* Draggable reference point */
      var dragPt = dynamicG.append('circle')
        .attr('cx', xScale(state.refX)).attr('cy', yScale(state.refY))
        .attr('r', 9).attr('fill', colors.equilibrium)
        .attr('stroke', '#fff').attr('stroke-width', 2)
        .attr('cursor', 'grab').attr('class', 'drag-point');

      dynamicG.append('text')
        .attr('x', xScale(state.refX) + 14).attr('y', yScale(state.refY) - 8)
        .style('fill', colors.equilibrium).style('font-size', '11px').style('font-weight', 'bold')
        .style('pointer-events', 'none')
        .text('(' + MT.fmt(state.refX, 0) + ', ' + MT.fmt(state.refY, 0) + ')');

      dragPt.call(d3.drag().on('drag', function (event) {
        var x = Math.round(xScale.invert(event.x));
        var y = Math.round(yScale.invert(event.y));
        x = Math.max(1, Math.min(maxX, x));
        y = Math.max(1, Math.min(maxY, y));
        if (x !== state.refX || y !== state.refY) {
          state.refX = x; state.refY = y;
          update();
        }
      }));

      /* Info panel */
      d3.select('#info-09').html(
        '<strong>Reference basket:</strong> (' + state.refX + ', ' + state.refY + ')' +
        '<br><strong>Utility:</strong> U = ' + MT.fmt(refU, 1) +
        '<br><span style="color:' + colors.positive + '">\u25CF Better</span>' +
        '&ensp;<span style="color:' + colors.highlight + '">\u25CF Indifferent</span>' +
        '&ensp;<span style="color:' + colors.negative + '">\u25CF Worse</span>'
      );

      /* Math */
      var label;
      if (state.utilType === 'cobb-douglas') label = 'U(x,y) = xy = ' + MT.fmt(refU, 0);
      else if (state.utilType === 'perfect-subs') label = 'U(x,y) = x + y = ' + MT.fmt(refU, 0);
      else label = 'U(x,y) = \\min(x,y) = ' + MT.fmt(refU, 0);
      MT.updateMath('math-09', label);
    }

    function drawIC(g, uTarget, color, sw) {
      if (state.utilType === 'cobb-douglas') {
        if (uTarget <= 0) return;
        var xLo = Math.max(0.5, uTarget / maxY);
        var xHi = Math.min(maxX, uTarget / 0.5);
        MT.drawCurve(g,
          function (x) { return uTarget / x; },
          [xLo, xHi], xScale, yScale,
          { color: color, strokeWidth: sw, nPoints: 300 });
      } else if (state.utilType === 'perfect-subs') {
        MT.drawCurve(g,
          function (x) { return uTarget - x; },
          [Math.max(0, uTarget - maxY), Math.min(uTarget, maxX)],
          xScale, yScale, { color: color, strokeWidth: sw });
      } else {
        /* Perfect complements: L-shape at (U, U) */
        if (uTarget <= maxX && uTarget <= maxY) {
          g.append('line')
            .attr('x1', xScale(uTarget)).attr('y1', yScale(uTarget))
            .attr('x2', xScale(uTarget)).attr('y2', yScale(maxY))
            .attr('stroke', color).attr('stroke-width', sw);
          g.append('line')
            .attr('x1', xScale(uTarget)).attr('y1', yScale(uTarget))
            .attr('x2', xScale(maxX)).attr('y2', yScale(uTarget))
            .attr('stroke', color).attr('stroke-width', sw);
        }
      }
    }

    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
