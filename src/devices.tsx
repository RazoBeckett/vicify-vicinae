import { useState, useEffect } from 'react';
import { List, ActionPanel, Action, Icon, showToast, Toast } from '@vicinae/api';
import { getSpotifyClient, handleSpotifyError, safeApiCall } from './utils/spotify';
import { saveLastDeviceName, getLastDeviceName } from './utils/config';

export default function Devices() {
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDevicesAndAutoSelect();
  }, []);

  async function loadDevicesAndAutoSelect() {
    try {
      setIsLoading(true);
      const spotify = await getSpotifyClient();

      const devicesResponse = await spotify.player.getAvailableDevices();
      const devices = devicesResponse.devices || [];
      setDevices(devices);

      if (!devices || devices.length === 0) {
        await showToast({
          style: Toast.Style.Failure,
          title: 'No Devices Found',
          message: 'Please open Spotify on a device to see available devices',
        });
        setIsLoading(false);
        return;
      }

      const lastDeviceName = getLastDeviceName();
      if (!lastDeviceName) {
        setIsLoading(false);
        return;
      }

      const device = devices.find(d => d.name === lastDeviceName);
      if (!device) {
        console.log('[Vicify] Last device not found, will retry...');
        await showToast({
          style: Toast.Style.Animated,
          title: 'Looking for device...',
          message: `${lastDeviceName} not found, retrying...`,
        });

        setTimeout(async () => {
          await loadDevicesAndAutoSelectWithRetry(lastDeviceName);
        }, 3500);
        return;
      }

      const success = await autoSelectDevice(devices);
      if (!success) {
        console.log('[Vicify] Auto-selection failed on first attempt');
      }
      setIsLoading(false);
    } catch (error) {
      await handleSpotifyError(error, 'Failed to load devices');
      setIsLoading(false);
    }
  }

  async function loadDevicesAndAutoSelectWithRetry(lastDeviceName: string) {
    try {
      setIsLoading(true);
      const spotify = await getSpotifyClient();

      const devicesResponse = await spotify.player.getAvailableDevices();
      const devices = devicesResponse.devices || [];
      setDevices(devices);

      const device = devices.find(d => d.name === lastDeviceName);
      if (device) {
        await autoSelectDevice(devices);
      } else {
        console.log('[Vicify] Last device still not found after retry');
        await showToast({
          style: Toast.Style.Failure,
          title: 'Device Not Found',
          message: `${lastDeviceName} is not available`,
        });
      }
    } catch (error) {
      await handleSpotifyError(error, 'Failed to retry device selection');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadDevices() {
    try {
      setIsLoading(true);
      const spotify = await getSpotifyClient();
      
      const devicesResponse = await spotify.player.getAvailableDevices();
      setDevices(devicesResponse.devices || []);
      
      if (!devicesResponse.devices || devicesResponse.devices.length === 0) {
        await showToast({
          style: Toast.Style.Failure,
          title: 'No Devices Found',
          message: 'Please open Spotify on a device to see available devices',
        });
      }
    } catch (error) {
      await handleSpotifyError(error, 'Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  }

  async function switchToDevice(deviceId: string, deviceName: string) {
    try {
      const spotify = await getSpotifyClient();
      await safeApiCall(() => spotify.player.transferPlayback([deviceId], true));

      saveLastDeviceName(deviceName);

      await showToast({
        style: Toast.Style.Success,
        title: 'Device Switched',
        message: `Playback transferred to ${deviceName}`,
      });

      // Reload devices to update active status
      await loadDevices();
    } catch (error) {
      await handleSpotifyError(error, 'Failed to switch device');
    }
  }

  async function autoSelectDevice(devices: any[]): Promise<boolean> {
    const lastDeviceName = getLastDeviceName();
    if (!lastDeviceName) {
      return false;
    }

    const device = devices.find(d => d.name === lastDeviceName);
    if (!device) {
      return false;
    }

    try {
      const spotify = await getSpotifyClient();
      await safeApiCall(() => spotify.player.transferPlayback([device.id], true));

      console.log('[Vicify] Auto-selected device:', lastDeviceName);

      await showToast({
        style: Toast.Style.Success,
        title: 'Device Auto-Selected',
        message: `Restored playback to ${lastDeviceName}`,
      });

      await loadDevices();
      return true;
    } catch (error) {
      await handleSpotifyError(error, 'Failed to auto-select device');
      return false;
    }
  }

  function getDeviceIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'computer':
        return Icon.Desktop;
      case 'smartphone':
        return Icon.Mobile;
      case 'speaker':
        return Icon.SpeakerOn;
      case 'tv':
        return Icon.Monitor;
      default:
        return Icon.SpeakerOn;
    }
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search devices...">
      {devices.length === 0 && !isLoading && (
        <List.EmptyView
          icon={Icon.SpeakerOff}
          title="No Devices Available"
          description="Open Spotify on a device to see available playback devices"
        />
      )}
      
      {devices.map((device) => (
        <List.Item
          key={device.id}
          title={device.name}
          subtitle={device.type}
          icon={getDeviceIcon(device.type)}
          accessories={[
            ...(device.volume_percent !== null 
              ? [{ text: `${device.volume_percent}%` }] 
              : []
            ),
            ...(device.is_active 
              ? [{ icon: Icon.CheckCircle, tooltip: 'Active' }] 
              : []
            ),
          ]}
          actions={
            <ActionPanel>
              {!device.is_active && (
                <Action
                  title="Switch to Device"
                  icon={Icon.SpeakerOn}
                  onAction={() => switchToDevice(device.id, device.name)}
                />
              )}
              {device.is_active && (
                <Action
                  title="Active Device"
                  icon={Icon.CheckCircle}
                  onAction={() => showToast({
                    style: Toast.Style.Success,
                    title: 'Already Active',
                    message: `${device.name} is currently active`,
                  })}
                />
              )}
              <Action
                title="Refresh Devices"
                icon={Icon.ArrowClockwise}
                shortcut={{ modifiers: ['cmd'], key: 'r' }}
                onAction={loadDevices}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
