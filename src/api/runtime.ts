import { callParentVoid, isSandbox } from '../utils';
class SandboxRuntime {
    getManifest(): ReturnType<typeof chrome.runtime.getManifest> {
        return {
            manifest_version: 2,
            name: 'Net logs',
            version: '0.0.2'
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
    : chrome.runtime
    ? chrome.runtime
    : new LocalRuntime();
