import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Badge, Avatar, Menu, MenuItem, Divider, ListItemIcon, Tooltip } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Folder as ProjectsIcon,
  Upload as UploadIcon,
  AccountTree as ControlFlowIcon,
  Android as AndroidIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Security as SecurityIcon,
  BugReport as BugReportIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications] = useState([
    'New security vulnerability detected',
    'Scan completed: Project X',
    'Update available: v2.0.0',
  ]);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { label: 'Projects', path: '/projects', icon: <ProjectsIcon /> },
    { label: 'Analyze', path: '/analyze', icon: <SecurityIcon /> },
    { label: 'Issues', path: '/issues', icon: <BugReportIcon /> },
    { label: 'Control Flow', path: '/control-flow', icon: <ControlFlowIcon /> },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMobileToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={scrolled ? 4 : 0}
      sx={{
        background: scrolled 
          ? 'rgba(10, 10, 26, 0.9)' 
          : 'linear-gradient(90deg, rgba(10,10,26,0.9) 0%, rgba(19,19,43,0.8) 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
        transition: 'all 0.3s ease',
        zIndex: 1300,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', padding: '0.5rem 1.5rem' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box 
            component={motion.div}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              textDecoration: 'none',
            }}
            onClick={() => navigate('/')}
          >
            <SecurityIcon sx={{ fontSize: '2rem', color: 'primary.main' }} />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #3b82f6 30%, #8b5cf6 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              GameGuard
            </Typography>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, ml: 4 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                startIcon={item.icon}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  color: location.pathname === item.path ? 'primary.light' : 'text.secondary',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  position: 'relative',
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    width: location.pathname === item.path ? '80%' : '0%',
                    height: '2px',
                    backgroundColor: 'primary.main',
                    transform: 'translateX(-50%)',
                    transition: 'width 0.3s ease',
                  },
                  '&:hover': {
                    color: 'primary.light',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    '&:after': {
                      width: '80%',
                    },
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Notifications">
            <IconButton 
              size="large"
              color="inherit"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '&:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                },
              }}
            >
              <Badge badgeContent={notifications.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Account settings">
            <IconButton
              onClick={handleMenu}
              size="small"
              sx={{ ml: 2 }}
              aria-controls="account-menu"
              aria-haspopup="true"
            >
              <StyledBadge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
              >
                <Avatar 
                  sx={{ 
                    width: 40, 
                    height: 40,
                    background: 'linear-gradient(45deg, #3b82f6 30%, #8b5cf6 90%)',
                  }}
                >
                  <PersonIcon />
                </Avatar>
              </StyledBadge>
            </IconButton>
          </Tooltip>

          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleMobileToggle}
            sx={{ 
              display: { md: 'none' },
              ml: 1,
            }}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </Box>
      </Toolbar>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <Box sx={{ display: { md: 'none' }, pb: 2, px: 2 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  fullWidth
                  startIcon={item.icon}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    justifyContent: 'flex-start',
                    color: location.pathname === item.path ? 'primary.light' : 'text.primary',
                    backgroundColor: location.pathname === item.path ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    mb: 0.5,
                    '&:hover': {
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Menu */}
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          background: 'rgba(19, 19, 43, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <MenuItem onClick={handleClose}>
        <ListItemIcon>
          <PersonIcon fontSize="small" />
        </ListItemIcon>
        Profile
      </MenuItem>
      <MenuItem onClick={handleClose}>
        <ListItemIcon>
          <Avatar sx={{ width: 24, height: 24 }} />
        </ListItemIcon>
        My Account
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleClose}>
        <ListItemIcon>
          <SettingsIcon fontSize="small" />
        </ListItemIcon>
        Settings
      </MenuItem>
      <MenuItem onClick={handleClose}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        Logout
      </MenuItem>
    </Menu>
  </AppBar>
  );
};

export default Navbar;
