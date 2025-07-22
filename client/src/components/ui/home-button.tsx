import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

interface HomeButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export default function HomeButton({ 
  variant = "outline", 
  size = "sm",
  className = ""
}: HomeButtonProps) {
  return (
    <Link href="/">
      <Button variant={variant} size={size} className={`${className}`}>
        <Home className="h-4 w-4 mr-2" />
        Inicio
      </Button>
    </Link>
  );
}