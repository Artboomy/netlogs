import { callParentVoid, isSandbox } from '../utils';

class SandboxRuntime {
    getManifest(): ReturnType<typeof chrome.runtime.getManifest> {
        return {
            manifest_version: 3,
            name: 'Net logs',
            version: '1.4.1'
        };
    }

    openOptionsPage(): void {
        callParentVoid('chrome.runtime.openOptionsPage');
    }
}

const sandboxRuntime = new SandboxRuntime();

class LocalRuntime {
    getManifest() {
        return {
            manifest_version: 2,
            name: 'Net logs',
            version: '0.0.1'
        };
    }

    openOptionsPage(): void {
        //pass
    }
}

export default isSandbox()
    ? sandboxRuntime
    : window.chrome?.runtime
    ? window.chrome.runtime
    : new LocalRuntime();
