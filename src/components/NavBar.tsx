import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, User, LogOut, Bookmark, FileCheck, BookOpen } from "lucide-react";

const NavBar = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Helper to determine if a link is active
  const isActiveLink = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <nav className="bg-background border-b border-slate-200 py-3 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto flex justify-between items-center px-4">
        {/* Logo with enhanced styling */}
        <Link to="/" className="flex items-center space-x-2">
          <span className="font-bold text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            InterviewAce
          </span>
        </Link>

        {/* Desktop Navigation with improved spacing and active states */}
        <div className="hidden md:flex items-center space-x-8">
          {user ? (
            <>
              <div className="flex items-center space-x-6">
                <Link 
                  to="/dashboard" 
                  className={`text-base font-medium hover:text-primary transition-colors ${
                    isActiveLink('/dashboard') ? 'text-primary border-b-2 border-primary pb-1' : 'text-foreground'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/saved" 
                  className={`text-base font-medium hover:text-primary transition-colors ${
                    isActiveLink('/saved') ? 'text-primary border-b-2 border-primary pb-1' : 'text-foreground'
                  }`}
                >
                  Saved Questions
                </Link>
                <Link 
                  to="/saved-cheat-sheets" 
                  className={`text-base font-medium hover:text-primary transition-colors ${
                    isActiveLink('/saved-cheat-sheets') ? 'text-primary border-b-2 border-primary pb-1' : 'text-foreground'
                  }`}
                >
                  Cheat Sheets
                </Link>
                <Link 
                  to="/study-hub" 
                  className={`text-base font-medium hover:text-primary transition-colors ${
                    isActiveLink('/study-hub') ? 'text-primary border-b-2 border-primary pb-1' : 'text-foreground'
                  }`}
                >
                  Study Hub
                </Link>
              </div>

              {/* User dropdown with enhanced styling */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="default" 
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:shadow transition-all"
                  >
                    <div className="font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="font-medium text-foreground">My Account</p>
                      <p className="text-xs text-muted-foreground">{user.email || "User"}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/saved" className="flex items-center w-full cursor-pointer">
                      <Bookmark className="mr-2 h-4 w-4" />
                      <span>Saved Questions</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/saved-cheat-sheets" className="flex items-center w-full cursor-pointer">
                      <FileCheck className="mr-2 h-4 w-4" />
                      <span>Saved Cheat Sheets</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/study-hub" className="flex items-center w-full cursor-pointer">
                      <BookOpen className="mr-2 h-4 w-4" />
                      <span>Study Hub</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={logout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/login" className="text-base font-medium text-foreground hover:text-primary transition-colors">
                Login
              </Link>
              <Button asChild className="shadow-sm hover:shadow">
                <Link to="/register">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Navigation with improved dropdown */}
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="hover:bg-slate-100"
          >
            <Menu className="h-6 w-6" />
          </Button>

          {isMenuOpen && (
            <div className="absolute top-16 right-4 w-64 rounded-lg bg-background border shadow-lg py-2 z-10">
              {user && (
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{user.email || "User"}</p>
                </div>
              )}
              
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`flex items-center px-4 py-2 text-sm hover:bg-slate-50 ${
                      isActiveLink('/dashboard') ? 'text-primary font-medium' : 'text-foreground'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/saved"
                    className={`flex items-center px-4 py-2 text-sm hover:bg-slate-50 ${
                      isActiveLink('/saved') ? 'text-primary font-medium' : 'text-foreground'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Bookmark className="mr-2 h-4 w-4" />
                    Saved Questions
                  </Link>
                  <Link
                    to="/saved-cheat-sheets"
                    className={`flex items-center px-4 py-2 text-sm hover:bg-slate-50 ${
                      isActiveLink('/saved-cheat-sheets') ? 'text-primary font-medium' : 'text-foreground'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FileCheck className="mr-2 h-4 w-4" />
                    Saved Cheat Sheets
                  </Link>
                  <Link
                    to="/study-hub"
                    className={`flex items-center px-4 py-2 text-sm hover:bg-slate-50 ${
                      isActiveLink('/study-hub') ? 'text-primary font-medium' : 'text-foreground'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Study Hub
                  </Link>
                  <div className="border-t border-slate-100 mt-2 pt-2">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-slate-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-destructive hover:bg-slate-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-4 py-3 text-sm text-foreground hover:bg-slate-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-3 text-sm font-medium text-primary hover:bg-slate-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;