"use client";
import { useEffect, useRef, useState } from "react";
import {
  Engine,
  Render,
  World,
  Bodies,
  Vector,
  Body,
} from "matter-js";

declare global {
  interface Window {
    DeviceOrientationEvent: typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<string>;
    };
  }
}

export default function HomePage() {

  const [requestedPermission, setRequestedPermission] = useState(false);
  const scene = useRef(null);
  const engine = useRef(Engine.create());
  const bodies = useRef<Body[]>([]);

  useEffect(() => {
    if (!scene.current) return;

    // get the canvas
    const canvas = scene.current as HTMLDivElement;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;

    const render = Render.create({
      element: scene.current,
      engine: engine.current,
      options: {
        width: cw,
        height: ch,
        wireframes: false,
        background: "transparent",
      },
    });

    // add mouse control
    // World.add(engine.current.world, mouseConstraint);

    // boundaries
    World.add(engine.current.world, [
      Bodies.rectangle(cw / 2, -10, cw, 20, { isStatic: true }),
      Bodies.rectangle(-10, ch / 2, 20, ch, { isStatic: true }),
      Bodies.rectangle(cw / 2, ch + 10, cw, 20, { isStatic: true }),
      Bodies.rectangle(cw + 10, ch / 2, 20, ch, { isStatic: true }),
    ]);

    // run the engine
    Engine.run(engine.current);
    Render.run(render);

    // unmount
    return () => {
      // destroy Matter
      Render.stop(render);
      // World.remove(engine.current.world)
      // World.remove(engine.current.world, mouseConstraint);
      Engine.clear(engine.current);
      render.canvas.remove();
      // render.canvas = null
      // render.context = null
      render.textures = {};
    };
  }, []);
  
  useEffect(() => {
    // Set a CSS variable to the height of the viewport
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    // Update the CSS variable whenever the window is resized
    const handleResize = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!requestedPermission) requestPermission();
    const addCircle = (params: any): Body => {
      const body = Bodies.circle(
        params.x,
        params.y,
        params.radius,
        params.options,
      );
      return body;
    };

    const addRectangle = (params: any): Body => {
      const body = Bodies.rectangle(
        params.x,
        params.y,
        params.radius,
        params.radius,
        params.options,
      );
      return body;
    };

    // get the x and y coordinates of the click event relative to the element
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    // generate a random color
    const color = "#" + Math.floor(Math.random() * 16777215).toString(16);

    // create a body with random size and add it to the world
    const params = {
      x,
      y,
      radius: 10 + Math.random() * 20,
      options: {
        mass: 10,
        // restitution is the "bounciness" of the object
        restitution: 0.9,
        // friction is the "roughness" of the object
        friction: 0.000,
        render: {
          fillStyle: `${color}`,
        },
      },
    };

    let body = null;

    // 50% chance of adding a circle or a rectangle
    if (Math.random() > 0.5) {
      body = addCircle(params);
    } else {
      body = addRectangle(params);
    }
    console.log(body)

    // add the body to the world
    if (body) {
      World.add(engine.current.world, [body]);
      bodies.current.push(body);
    }
  };

  // apply force based on the touch position
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (touch)
    applyForce({ x: touch.clientX, y: touch.clientY });
  }

  // apply force based on the mouse position
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const mousePosition = {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    };
    applyForce(mousePosition);
  };

  // apply a force to all bodies within a certain distance of the mouse
  const applyForce = (
    position: { x: number; y: number },
  ) => {
      bodies.current.forEach((body) => {
      const distance = Vector.magnitude(
        Vector.sub(position, body.position),
      );

      if (distance < 50) {
        // adjust this value to control the "sensitivity" of the balls
        const force = Vector.mult(
          Vector.normalise(Vector.sub(body.position, position)),
          0.1,
        ); // adjust the multiplier to control the "strength" of the force
        Body.applyForce(body, body.position, force);
      }
    });
  }

  const handleDeviceOrientation = (event: any) => {
    // alpha: rotation around z-axis
    const rotateDegrees = event.alpha || 0;
    // gamma: left to right
    const leftToRight = event.gamma || 0; 
    // beta: front back motion
    const frontToBack = event.beta || 0;
    // adjust gravity based on the device orientation
    engine.current.world.gravity.x = Math.sin(leftToRight / 180 * Math.PI);
    engine.current.world.gravity.y = Math.sin(frontToBack / 180 * Math.PI);
    engine.current.world.gravity.x += Math.sin(rotateDegrees / 180 * Math.PI) * 0.1;

  };

  const requestPermission = async () => {
    if (requestedPermission) return;
    // create a event listener that listens device orientation change
    if (window.DeviceOrientationEvent) {
      // Check if we need to request permission for iOS 13+
      if (
        typeof window.DeviceOrientationEvent.requestPermission === "function"
      ) {
        // Handle user interaction
        const permissionState = await (
          window.DeviceOrientationEvent as any
        ).requestPermission();
        if (permissionState === "granted") {
          window.addEventListener("deviceorientation", handleDeviceOrientation);
        }
      } else {
        window.addEventListener("deviceorientation", handleDeviceOrientation);
      }
    }
    setRequestedPermission(true);
  };

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 text-white overflow-hidden"
    >
      <div
        ref={scene}
        className="h-screen w-screen bg-red"
        style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      />
    </main>
  );
}
