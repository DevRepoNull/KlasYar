import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { DirectionProvider } from "@radix-ui/react-direction"
import App from "./App"
import { Toaster } from "@/components/ui/toaster"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DirectionProvider dir="rtl">
      <App />
      <Toaster />
    </DirectionProvider>
  </StrictMode>,
)

