import { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Divider,
  Avatar,
  IconButton,
  AppBar,
  Toolbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard,
  BarChart,
  Person,
  People,
  Settings,
  ShoppingCart,
  Inventory,
  Mail,
  CalendarMonth,
  Folder,
  ExpandLess,
  ExpandMore,
  Menu as MenuIcon,
  Logout,
} from '@mui/icons-material';
import menuConfig from './menu.config.json';
import appConfig from './auth.config.json';

const DRAWER_WIDTH = 260;

// Mapa de nombres de iconos a componentes
const ICON_MAP: Record<string, React.ReactNode> = {
  Dashboard: <Dashboard />,
  BarChart: <BarChart />,
  Person: <Person />,
  People: <People />,
  Settings: <Settings />,
  ShoppingCart: <ShoppingCart />,
  Inventory: <Inventory />,
  Mail: <Mail />,
  CalendarMonth: <CalendarMonth />,
  Folder: <Folder />,
};

interface LayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  user: { username: string };
  groups: string[];
  onSignOut: () => void;
  isAdmin: boolean;
}

export default function Layout({ children, currentPath, onNavigate, user, groups, onSignOut, isAdmin }: LayoutProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const toggleSection = (label: string) => {
    setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {appConfig.app.logo ? (
          <Avatar src={appConfig.app.logo} sx={{ width: 36, height: 36 }} />
        ) : (
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 16 }}>
            {appConfig.app.title.charAt(0).toUpperCase()}
          </Avatar>
        )}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
            {appConfig.app.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {groups.length > 0 ? groups[0] : 'usuario'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Menu items */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        {menuConfig.sections.map((section, sIdx) => (
          <Box key={sIdx}>
            {section.label && (
              <Typography variant="overline" sx={{ px: 2, pt: 2, pb: 0.5, display: 'block', color: 'text.secondary', fontSize: '0.68rem' }}>
                {section.label}
              </Typography>
            )}
            <List dense disablePadding>
              {section.items
                .filter(item => !item.adminOnly || isAdmin)
                .map((item) => (
                  <Box key={item.path}>
                    <ListItemButton
                      selected={currentPath === item.path}
                      onClick={() => {
                        if (item.children && item.children.length > 0) {
                          toggleSection(item.path);
                        } else {
                          onNavigate(item.path);
                          if (isMobile) setMobileOpen(false);
                        }
                      }}
                      sx={{ mx: 1, borderRadius: 1, mb: 0.3 }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {ICON_MAP[item.icon] || <Folder />}
                      </ListItemIcon>
                      <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.875rem' }} />
                      {item.children && item.children.length > 0 && (
                        openSections[item.path] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />
                      )}
                    </ListItemButton>

                    {/* Subitems */}
                    {item.children && item.children.length > 0 && (
                      <Collapse in={openSections[item.path]} timeout="auto">
                        <List dense disablePadding sx={{ pl: 4 }}>
                          {item.children.map((child) => (
                            <ListItemButton
                              key={child.path}
                              selected={currentPath === child.path}
                              onClick={() => { onNavigate(child.path); if (isMobile) setMobileOpen(false); }}
                              sx={{ mx: 1, borderRadius: 1, mb: 0.3 }}
                            >
                              <ListItemText primary={child.label} primaryTypographyProps={{ fontSize: '0.82rem' }} />
                            </ListItemButton>
                          ))}
                        </List>
                      </Collapse>
                    )}
                  </Box>
                ))}
            </List>
          </Box>
        ))}
      </Box>

      <Divider />

      {/* User footer */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
          <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: 'secondary.main' }}>
            {user.username.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>
            {user.username}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onSignOut} title="Cerrar sesión">
          <Logout fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile AppBar */}
      {isMobile && (
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => setMobileOpen(!mobileOpen)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ ml: 1 }}>
              {appConfig.app.title}
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: isMobile ? 8 : 0,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
