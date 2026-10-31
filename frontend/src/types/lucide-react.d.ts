declare module 'lucide-react' {
  import * as React from 'react';
  export interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
  }
  export type Icon = React.FC<IconProps>;
  export const HeartHandshake: Icon;
  export const ShieldAlert: Icon;
  export const User: Icon;
  export const LogOut: Icon;
  export const Building2: Icon;
  export const Search: Icon;
  export const Activity: Icon;
  export const Lock: Icon;
  export const ShieldCheck: Icon;
  export const FileText: Icon;
  export const AlertTriangle: Icon;
  export const Heart: Icon;
  export const Zap: Icon;
  export const Clock: Icon;
  export const ArrowRight: Icon;
  export const Database: Icon;
  export const MapPin: Icon;
  export const CheckCircle2: Icon;
  export const CheckCircle: Icon;
  export const Navigation: Icon;
  export const Phone: Icon;
  export const XCircle: Icon;
  export const Package: Icon;
  export const Plus: Icon;
  export const RefreshCw: Icon;
  export const SlidersHorizontal: Icon;
  export const Calendar: Icon;
  export const Download: Icon;
  export const Users: Icon;
  export const PauseCircle: Icon;
  export const PlayCircle: Icon;
  export const Mail: Icon;
  const icons: { [key: string]: Icon };
  export default icons;
}
