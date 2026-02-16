import { useSnackbar } from 'notistack';

type VariantType = 'default' | 'error' | 'success' | 'warning' | 'info';

const useNotifications = () => {
  const { enqueueSnackbar } = useSnackbar();

  const showNotification = (message: string, variant: VariantType = 'default') => {
    enqueueSnackbar(message, {
      variant,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
      autoHideDuration: 5000,
    });
  };

  return { showNotification };
};

export default useNotifications;
