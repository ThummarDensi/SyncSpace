import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Sidebar.css';

const Sidebar = () => {
  const { currentWorkspace } = useSelector((state) => state.workspace);

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <NavLink to="/" className="sidebar-link" end>
          <span className="sidebar-icon">🏠</span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/friends" className="sidebar-link">
          <span className="sidebar-icon">👥</span>
          <span>Friend Requests</span>
        </NavLink>

        <NavLink to="/my-friends" className="sidebar-link">
          <span className="sidebar-icon">👨‍👩‍👧‍👦</span>
          <span>My Friends</span>
        </NavLink>

        {currentWorkspace && (
          <>
            <div className="sidebar-divider"></div>
            <div className="sidebar-section">
              <h3 className="sidebar-section-title">{currentWorkspace.name}</h3>
              
              <NavLink
                to={`/workspace/${currentWorkspace._id}`}
                className="sidebar-link"
                end
              >
                <span className="sidebar-icon">📊</span>
                <span>Overview</span>
              </NavLink>

              {currentWorkspace.boards && currentWorkspace.boards.length > 0 && (
                <NavLink
                  to={`/workspace/${currentWorkspace._id}/board/${currentWorkspace.boards[0]._id}`}
                  className="sidebar-link"
                >
                  <span className="sidebar-icon">📋</span>
                  <span>Boards</span>
                </NavLink>
              )}

              <NavLink
                to={`/workspace/${currentWorkspace._id}/chat`}
                className="sidebar-link"
              >
                <span className="sidebar-icon">💬</span>
                <span>Chat</span>
              </NavLink>

              <NavLink
                to={`/workspace/${currentWorkspace._id}/files`}
                className="sidebar-link"
              >
                <span className="sidebar-icon">📁</span>
                <span>Files</span>
              </NavLink>
            </div>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
