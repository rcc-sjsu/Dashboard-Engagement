import { useState } from "react";

export const ToggleBar = () => {
  const [selected, setSelected] = useState<"option1" | "option2">("option1");

  return (
    <div className="flex rounded-lg border bg-muted p-1 mx-12">
      <button
        className={`flex-1 py-2 text-center font-medium rounded-lg transition ${
          selected === "option1" ? "bg-primary text-white" : "text-foreground"
        }`}
        onClick={() => setSelected("option1")}
      >
        Option 1
      </button>
      <button
        className={`flex-1 py-2 text-center font-medium rounded-lg transition ${
          selected === "option2" ? "bg-primary text-white" : "text-foreground"
        }`}
        onClick={() => setSelected("option2")}
      >
        Option 2
      </button>
    </div>
  );
};
