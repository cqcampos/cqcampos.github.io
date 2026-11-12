/* Viz 10 — MRS Explorer
   Cobb-Douglas IC with draggable point; tangent line shows MRS.
   Toggle to show diminishing MRS with multiple tangent lines.        */
(function () {
  'use strict';
  var MT = window.MicroTools;

  function init() {
    var maxX = 20, maxY = 20;
    var state = { alpha: 0.5, refX: 10, refY: 10, showDiminishing: false };

    MT.addSlider('controls-10', {
      label: 'How much you value X vs Y (\u03B1)', min: 0.1, max: 0.9, value: 0.5, step: 0.05,
      format: function (v) {
        if (v < 0.4) return v.toFixed(2) + ' (value Y more)';
        if (v > 0.6) return v.toFixed(2) + ' (value X more)';
        return v.toFixed(2) + ' (balanced)';
      },
      onChange: function (v) {
        state.alpha = v;
        var U = getU(state.refX, state.refY);
        state.refY = Math.pow(U / Math.pow(state.refX, v), 1 / (1 - v));
        if (state.refY > maxY) {
          state.refY = maxY;
          state.refX = Math.pow(U / Math.pow(maxY, 1 - v), 1 / v);
        }
        render();
      }
    });

    MT.addToggle('controls-10', {
      label: 'Show diminishing MRS (multiple tangents)',
      checked: false,
      onChange: function (v) { state.showDiminishing = v; update(); }
    });

    var chart, xScale, yScale, dynamicG;

    function getU(x, y) {
      return Math.pow(x, state.alpha) * Math.pow(y, 1 - state.alpha);
    }

    function getMRS(x, y) {
      if (x <= 0) return Infinity;
      return (state.alpha / (1 - state.alpha)) * (y / x);
    }

    function setup() {
      chart = MT.createChart('chart-10', { height: 420 });
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
      var a = state.alpha;
      var U = getU(state.refX, state.refY);

      /* IC curve */
      var xLo = Math.max(0.3, Math.pow(U / Math.pow(maxY, 1 - a), 1 / a));
      var xHi = Math.min(maxX, Math.pow(U / Math.pow(0.3, 1 - a), 1 / a));
      MT.drawCurve(dynamicG,
        function (x) { return Math.pow(U / Math.pow(x, a), 1 / (1 - a)); },
        [xLo, xHi], xScale, yScale,
        { color: colors.demand, strokeWidth: 2.5, nPoints: 300 });

      /* Better region shading */
      var pts = [];
      for (var xi = xLo; xi <= xHi; xi += (xHi - xLo) / 100) {
        pts.push([xScale(xi), yScale(Math.pow(U / Math.pow(xi, a), 1 / (1 - a)))]);
      }
      var betterPts = pts.slice();
      betterPts.push([xScale(xHi), yScale(maxY)]);
      betterPts.push([xScale(xLo), yScale(maxY)]);
      MT.drawPoly(dynamicG, betterPts, { fill: colors.positive, opacity: 0.08 });

      /* Tangent at reference point */
      var mrs = getMRS(state.refX, state.refY);
      drawTangent(dynamicG, state.refX, state.refY, mrs, colors.equilibrium, 2);

      /* Diminishing MRS tangents */
      if (state.showDiminishing) {
        var nTangents = 5;
        for (var i = 0; i < nTangents; i++) {
          var frac = (i + 1) / (nTangents + 1);
          var tx = xLo + frac * (xHi - xLo);
          var ty = Math.pow(U / Math.pow(tx, a), 1 / (1 - a));
          if (ty > 0 && ty < maxY) {
            var tmrs = getMRS(tx, ty);
            drawTangent(dynamicG, tx, ty, tmrs, colors.textLight, 1);
            dynamicG.append('circle')
              .attr('cx', xScale(tx)).attr('cy', yScale(ty))
              .attr('r', 4).attr('fill', colors.textLight);
          }
        }
      }

      /* Draggable reference point */
      var dragPt = dynamicG.append('circle')
        .attr('cx', xScale(state.refX)).attr('cy', yScale(state.refY))
        .attr('r', 9).attr('fill', colors.equilibrium)
        .attr('stroke', '#fff').attr('stroke-width', 2)
        .attr('cursor', 'grab').attr('class', 'drag-point');

      dragPt.call(d3.drag().on('drag', function (event) {
        var x = xScale.invert(event.x);
        x = Math.max(0.5, Math.min(maxX - 0.5, x));
        var y = Math.pow(U / Math.pow(x, a), 1 / (1 - a));
        if (y > 0.3 && y < maxY) {
          state.refX = x; state.refY = y;
          update();
        }
      }));

      /* Info */
      var alphaInterp;
      if (a < 0.4) {
        alphaInterp = 'You care more about Y, so the curve is flatter \u2014 you won\u2019t give up much Y for extra X.';
      } else if (a > 0.6) {
        alphaInterp = 'You care more about X, so the curve is steeper \u2014 you\u2019d give up a lot of Y for extra X.';
      } else {
        alphaInterp = 'You value X and Y roughly equally, producing a symmetric curve.';
      }

      d3.select('#info-10').html(
        '<strong>All points on this curve give the same utility.</strong>' +
        '<br><strong>At this point:</strong> (' + MT.fmt(state.refX, 1) + ', ' + MT.fmt(state.refY, 1) + ')' +
        '<br><strong>MRS =</strong> ' + MT.fmt(mrs, 2) +
        ' \u2014 willing to give up ' + MT.fmt(mrs, 2) + ' units of Y for 1 more X.' +
        '<br><em>\u03B1 = ' + MT.fmt(a, 2) + ': ' + alphaInterp + '</em>'
      );

      MT.updateMath('math-10',
        'U(x,y) = x^{\\alpha} y^{1-\\alpha} = \\text{const along curve}' +
        '\\quad\\Rightarrow\\quad MRS = \\frac{\\alpha}{1-\\alpha}\\cdot\\frac{y}{x} = ' + MT.fmt(mrs, 2));
    }

    function drawTangent(g, px, py, mrs, color, sw) {
      var x1 = Math.max(0, px - py / mrs);
      var x2 = Math.min(maxX, px + (maxY - py) / mrs + 2);
      var y1 = py - mrs * (x1 - px);
      var y2 = py - mrs * (x2 - px);
      if (y1 > maxY) { y1 = maxY; x1 = px - (y1 - py) / mrs; }
      if (y2 < 0) { y2 = 0; x2 = px + py / mrs; }
      g.append('line')
        .attr('x1', xScale(x1)).attr('y1', yScale(y1))
        .attr('x2', xScale(x2)).attr('y2', yScale(y2))
        .attr('stroke', color).attr('stroke-width', sw)
        .attr('stroke-dasharray', '6,4');
    }

    render();
    MT.onThemeChange(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
