class Shield {
   constructor(center, radius, debug = false) {
      this.center = center;
      this.radius = radius;
      this.debug = debug;
      this.tmpCanvas = document.createElement("canvas");
      this.tmpCanvas.width = radius * 2;
      this.tmpCanvas.height = radius * 2;
      this.tmpCtx = this.tmpCanvas.getContext("2d");
      this.cached = false;
      this.rotation=0;
      this.size=null;
      if(debug){
         document.body.appendChild(this.tmpCanvas);
      }
   }
   update({x,y},rotation,size=null){
      this.center.x = x;
      this.center.y = y;
      this.rotation=rotation;
      this.size=size;
   }
   draw(ctx, lightPosition = { x: 200, y: 0 }) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2);
      ctx.clip();

      if (!this.cached) {
         const ringWidth = this.radius / 5;
         this.#drawRings(this.tmpCtx, ringWidth, [
            "#C55",
            "gray",
            "#C55",
            "#06F",
         ]);

         const starRadius = this.radius - ringWidth * 3;
         const center = {
            x: this.tmpCanvas.width / 2,
            y: this.tmpCanvas.height / 2,
         };
         this.#drawStar(this.tmpCtx, center, starRadius, "gray");

         this.#drawPolishingLines(this.tmpCtx);
         this.cached = true;
      }
      ctx.save();
      ctx.translate(this.center.x, this.center.y);
      ctx.rotate(this.rotation);
      ctx.drawImage(
         this.tmpCanvas,
         - this.radius,
         - this.radius
      );
      ctx.restore();


      this.#drawSpotlight(ctx, lightPosition);

      ctx.restore();
   }

   #drawSpotlight(ctx, lightPosition) {
      ctx.globalCompositeOperation = "lighter";
      // ray shown for debugging
      if (this.debug) {
         ctx.beginPath();
         ctx.moveTo(lightPosition.x, lightPosition.y);
         ctx.lineTo(this.center.x, this.center.y);
         ctx.strokeStyle = "cyan";
         ctx.lineWidth = 5;
         ctx.stroke();
         ctx.lineWidth = 2;
         ctx.strokeStyle = "black";
         ctx.stroke();
      }

      const midPoint = {
         x: (lightPosition.x + this.center.x) / 2,
         y: (lightPosition.y + this.center.y) / 2,
      };
      const distance = Math.hypot(
         lightPosition.x - this.center.x,
         lightPosition.y - this.center.y
      );
      const angle = Math.atan2(
         lightPosition.y - this.center.y,
         lightPosition.x - this.center.x
      );
      const angleOffset = Math.PI / 2;
      const scaleFactor = 1 - distance / (this.radius * 3);
      ctx.translate(midPoint.x, midPoint.y);
      ctx.rotate(angle + angleOffset);
      ctx.scale(1, scaleFactor);
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
      gradient.addColorStop(0, "#FFFE");
      gradient.addColorStop(0.2, "#FFFD");
      gradient.addColorStop(1, "#00F0");
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
   }

   #drawRings(ctx, ringWidth, colors) {
      const x = this.tmpCanvas.width / 2;
      const y = this.tmpCanvas.height / 2;

      let radius = this.radius;
      for (let i = 0; i < colors.length; i++) {
         ctx.beginPath();
         ctx.arc(x, y, radius, 0, Math.PI * 2);
         ctx.fillStyle = colors[i];
         ctx.fill();
         radius -= ringWidth;
      }

      // ring detail

      ctx.globalAlpha = 0.5;
      radius = this.radius;
      const ridgeWidth = ringWidth * 0.1;
      for (let i = 0; i < colors.length; i++) {
         ctx.beginPath();
         ctx.arc(x, y, radius, 0, Math.PI * 2);

         ctx.lineWidth = ridgeWidth;
         ctx.strokeStyle = "white";
         ctx.stroke();

         ctx.lineWidth = ridgeWidth * 0.2;
         ctx.strokeStyle = "black";
         ctx.stroke();

         radius -= ringWidth;
      }
      ctx.globalAlpha = 1;
   }

   #drawPolishingLines(ctx) {
      const x = this.tmpCanvas.width / 2;
      const y = this.tmpCanvas.height / 2;
      let radius = this.radius;
      const maxWidth = this.radius / 250;
      const minWidth = this.radius / 350;
      const minDashLength = this.radius / 12;
      const maxDashLength = this.radius / 3;
      const closeness = this.radius / 800;
      ctx.globalCompositeOperation = "multiply";
      while (radius > 0) {
         ctx.beginPath();
         const endAngle = Math.PI * 2 * Math.random();
         const startAngle = Math.random() * Math.PI * 2;
         ctx.arc(x, y, radius, startAngle, endAngle);
         ctx.lineWidth = Math.random() * (maxWidth - minWidth) + minWidth;

         const randomDashes = Array.from(
            { length: 21 },
            () =>
               Math.random() * (maxDashLength - minDashLength) + minDashLength
         );
         ctx.setLineDash(randomDashes);
         const opacity = 0.2 + Math.random() * 0.2;

         const l = 50 + Math.random() * 40;
         ctx.strokeStyle = `hsla(0, 0%, ${l}%, ${opacity})`;
         ctx.stroke();
         radius -= closeness;
      }
      ctx.setLineDash([]);
      ctx.globalCompositeOperation = "source-over";
   }

   #drawStar(ctx, center, radius, color, detailColor = "#FFFA") {
      const points = this.#generateStartPoints(center, radius);
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
         const { x, y } = points[i];
         ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // star detail
      ctx.strokeStyle = detailColor;
      ctx.lineWidth = 0.5;
      const starDetailRadius = radius * 0.9;
      const detailPoints = this.#generateStartPoints(center, starDetailRadius);
      ctx.beginPath();
      for (let i = 0; i < detailPoints.length; i++) {
         const { x, y } = detailPoints[i];
         ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      for (let i = 1; i < points.length; i += 2) {
         ctx.beginPath();
         ctx.moveTo(points[i].x, points[i].y);
         ctx.lineTo(center.x, center.y);
         ctx.stroke();
      }
   }

   #generateStartPoints(center, outerRadius) {
      const points = [];
      const pointCount = 10;
      const innerRadius = outerRadius * 0.4;
      for (let i = 0; i < pointCount; i++) {
         const angle = (Math.PI * 2 * i) / pointCount - Math.PI / 2;
         const radius = i % 2 === 0 ? outerRadius : innerRadius;
         const x = center.x + radius * Math.cos(angle);
         const y = center.y + radius * Math.sin(angle);
         points.push({ x, y });
      }
      return points;
   }
}
