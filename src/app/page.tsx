"use client";

declare global {
  interface Window {
    DeviceOrientationEvent: typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<string>;
    };
  }
}

interface Coordinate {
  x: number;
  y: number;
}

let position: Coordinate = { x: 50, y: 50 };
let velocity: Coordinate = { x: 0, y: 0 };
let ballProperties = {
  radius: 50,
  width: 50,
  height: 50,
  color: "#1070a3",
  // x: 50,
  // y: 50,
  // vx: 0,
  // vy: 0,
  friction: 0.5,
  maxVelocity: 3,
};

export default function HomePage() {

  const renderVar = (name: string, value: number) => {
    return (
      <div>
        <span>
          {name}: {value.toFixed(2)}
        </span>
      </div>
    );
  };

  const handleDeviceOrientation = (event: any) => {
    // alpha: rotation around z-axis
    // const rotateDegrees = event.alpha;
    // gamma: left to right
    const leftToRight = event.gamma;
    // beta: front back motion
    const frontToBack = event.beta;

    // update velocity and position
    velocity = handleVelocity(frontToBack, leftToRight);
    position = handlePosition();
  };

  const handlePosition = () => {
    // Update the ball's position
    let newX = position.x + velocity.x;
    let newY = position.y + velocity.y;

    // Ensure that the ball's position stays within the 0-100% range
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));

    return { x: newX, y: newY };
  };

  const handleVelocity = (frontToBack: number, leftToRight: number) => {

    // get the current position of the ball
    const x = position.x;
    const y = position.y;
    const prevVelocity = velocity;

    // get the friction and maxVelocity from the ballProperties
    const { friction, maxVelocity } = ballProperties;

    // calculate the new velocity
    let newVX = prevVelocity.x + leftToRight / 100;
    let newVY = prevVelocity.y + frontToBack / 100;

    // ensure the velocity stays within the maxVelocity and -maxVelocity
    newVX = Math.max(-maxVelocity, Math.min(maxVelocity, newVX));
    newVY = Math.max(-maxVelocity, Math.min(maxVelocity, newVY));

    // if the ball hits the edge, bounce it back
    if (y + prevVelocity.y < 0 || y + prevVelocity.y > 100) {
      newVY = -newVY * friction;
    }
    if (x + prevVelocity.x < 0 || x + prevVelocity.x > 90) {
      newVX = -newVX * friction;
    }

    return { x: newVX, y: newVY };
  };

  const requestPermission = async () => {
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
        alert(permissionState);
        if (permissionState === "granted") {
          window.addEventListener("deviceorientation", handleDeviceOrientation);
        }
      } else {
        window.addEventListener("deviceorientation", handleDeviceOrientation);
      }
    }
    // reset vars
    velocity = { x: 0, y: 0 };
    position = { x: 50, y: 50 };
  };

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 text-white"
      onClick={requestPermission}
    >
      <div className="flex flex-col gap-4">
        {renderVar("x", position.x)}
        {renderVar("y", position.y)}
        {renderVar("velocity.x", velocity.x)}
        {renderVar("velocity.y", velocity.y)}
      </div>
      <div
        id="ball"
        style={{
          position: "absolute",
          top: `${position.y}%`,
          left: `${position.x}%`,
          width: `${ballProperties.width}px`,
          height: `${ballProperties.height}px`,
          borderRadius: "50%",
          backgroundColor: "#1070a3",
        }}
      ></div>
    </main>
  );
}
