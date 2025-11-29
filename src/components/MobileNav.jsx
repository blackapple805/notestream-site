// src/components/MobileNav.jsx
import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiFileText,
  FiBarChart2,
  FiLayers,
  FiSettings,
} from "react-icons/fi";

export default function MobileNav() {
  const links = [
    { to: "/dashboard", icon: <FiHome />, label: "Home", root: true },
    { to: "/dashboard/notes", icon: <FiFileText />, label: "Notes" },
    { to: "/dashboard/documents", icon: <FiLayers />, label: "Docs" },
    { to: "/dashboard/activity", icon: <FiBarChart2 />, label: "Activity" },
    { to: "/dashboard/settings", icon: <FiSettings />, label: "Settings" },
  ];

  return (
    <div
      className="
        w-full 
        h-[var(--mobile-nav-height)]
        bg-[#111118]/85 backdrop-blur-xl
        border-t border-[#1f1f25]
        shadow-[0_0_40px_rgba(99,102,241,0.18)]
        flex justify-around items-center
        px-4
        pb-[env(safe-area-inset-bottom)]
        pt-1
      "
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {links.map((item, i) => (
        <NavLink
          key={i}
          to={item.to}
          end={item.root ? true : false}   // <-- IMPORTANT FIX
          className={({ isActive }) =>
            `
              flex flex-col items-center justify-center
              text-xs transition-all duration-300
              ${
                isActive
                  ? "text-indigo-400"
                  : "text-gray-500 hover:text-gray-300 active:text-indigo-300"
              }
            `
          }
        >
          <div className="text-xl mb-1 transition-all">
            {item.icon}
          </div>
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}
