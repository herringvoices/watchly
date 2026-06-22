import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faPlus,
  faUserGroup,
  faCircleUser,
  faRightFromBracket,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../contexts/AuthContext";
import "./NavBar.css";

interface NavBarProps {
  onAddUpdate?: () => void;
}

export function NavBar({ onAddUpdate }: NavBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    }
    if (popoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

  function handleLogout() {
    setPopoverOpen(false);
    logout();
    navigate("/login");
  }

  function handleViewProfile() {
    setPopoverOpen(false);
    if (user) navigate(`/users/${user.id}`);
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Nav links */}
        <ul className="navbar-links">
          <li className="navbar-item--mobile-only">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `navbar-link${isActive ? " navbar-link--active" : ""}`
              }
              aria-label="Home"
            >
              <span className="navbar-link-icon">
                <FontAwesomeIcon icon={faEye} />
              </span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/search"
              className={({ isActive }) =>
                `navbar-link${isActive ? " navbar-link--active" : ""}`
              }
              aria-label="Search"
            >
              <span className="navbar-link-icon">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </span>
              <span className="navbar-link-label">Search</span>
            </NavLink>
          </li>

          {/* Add update — dark circle button */}
          <li>
            <button
              className="navbar-link navbar-add-btn"
              aria-label="Add update"
              onClick={onAddUpdate}
            >
              <span className="navbar-link-icon">
                <FontAwesomeIcon icon={faPlus} />
              </span>
            </button>
          </li>

          <li>
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `navbar-link${isActive ? " navbar-link--active" : ""}`
              }
              aria-label="People"
            >
              <span className="navbar-link-icon">
                <FontAwesomeIcon icon={faUserGroup} />
              </span>
              <span className="navbar-link-label">People</span>
            </NavLink>
          </li>
        </ul>

        {/* Profile — icon matches other nav items, popover for logout */}
        <div className="navbar-profile" ref={popoverRef}>
          <button
            className="navbar-link"
            onClick={() => setPopoverOpen((o) => !o)}
            aria-label="Open profile menu"
            aria-expanded={popoverOpen}
          >
            <span className="navbar-link-icon">
              <FontAwesomeIcon icon={faCircleUser} />
            </span>
            <span className="navbar-link-label">Profile</span>
          </button>

          {popoverOpen && (
            <div className="navbar-popover" role="menu">
              <button
                className="navbar-popover-item"
                onClick={handleViewProfile}
                role="menuitem"
              >
                <FontAwesomeIcon icon={faCircleUser} />
                View Profile
              </button>
              <button
                className="navbar-popover-item navbar-popover-item--danger"
                onClick={handleLogout}
                role="menuitem"
              >
                <FontAwesomeIcon icon={faRightFromBracket} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
