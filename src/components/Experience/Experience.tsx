import { PhaserCanvas } from "../PhaseCanvas";

const Experience = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050507",
        color: "#fff",
        padding: 16,
      }}
    >
      <h1 style={{ fontSize: 20, marginBottom: 10 }}>
        Isometric Phaser + React шаблон
      </h1>
      <p style={{ opacity: 0.75, marginBottom: 12 }}>
        Стрілки/WASD — крок. Клік по тайлу — рух по A*.
      </p>
      <PhaserCanvas />
    </div>
  );
};

export default Experience;
