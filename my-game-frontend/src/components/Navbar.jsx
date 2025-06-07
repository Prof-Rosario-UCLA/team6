import { NavLink } from 'react-router-dom'

export default function Navbar() {
  const links = [
    { to: '/',        label: 'Lobby'    },
    { to: '/prompt',  label: 'Prompts'  },
    { to: '/drawing', label: 'Drawing'  },
    { to: '/voting',  label: 'Voting'   },
    { to: '/results', label: 'Results'  },
  ]
  return (
    <nav className="bg-white shadow">
      <ul className="flex space-x-4 p-4">
        {links.map(l => (
          <li key={l.to}>
            <NavLink
              to={l.to}
              className={({ isActive }) =>
                isActive
                  ? 'font-bold text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }
            >
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
