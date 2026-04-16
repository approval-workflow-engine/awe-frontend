import PersonIcon from '@mui/icons-material/Person';
import HttpIcon from '@mui/icons-material/Http';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import CodeIcon from '@mui/icons-material/Code';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface Props {
  type: string;
  color: string;
  isFailureEnd?: boolean;
}

export default function NodeIcon({ type, color, isFailureEnd }: Props) {
  const s = { fontSize: 16, color } as const;
  if (type === 'start')             return <PlayCircleIcon sx={s} />;
  if (type === 'user_task')         return <PersonIcon sx={s} />;
  if (type === 'service_task')      return <HttpIcon sx={s} />;
  if (type === 'email_task')        return <MailOutlineIcon sx={s} />;
  if (type === 'script_task')       return <CodeIcon sx={s} />;
  if (type === 'exclusive_gateway') return <AltRouteIcon sx={s} />;
  if (type === 'end')               return isFailureEnd ? <WarningAmberIcon sx={s} /> : <StopCircleIcon sx={s} />;
  return <CodeIcon sx={s} />;
}
