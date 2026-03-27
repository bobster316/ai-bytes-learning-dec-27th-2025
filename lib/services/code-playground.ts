
import { Sandbox } from '@e2b/sdk';

export interface ExecutionResult {
    stdout: string[];
    stderr: string[];
    error?: string;
    exitCode?: number;
}

export class CodePlaygroundService {
    /**
     * Executes Python code in a secure E2B sandbox
     */
    async executeCode(code: string): Promise<ExecutionResult> {
        console.log("🚀 Executing code in E2B sandbox...");
        const stdout: string[] = [];
        const stderr: string[] = [];

        try {
            const sandbox = await Sandbox.create({
                template: 'base',
                apiKey: process.env.E2B_API_KEY,
                timeout: 300000 // 5 minutes (increased for safety)
            });

            // 1. Pre-process code to extract dependencies
            const lines = code.split('\n');
            const installCommands: string[] = [];
            const pythonLines: string[] = [];

            lines.forEach(line => {
                const trimmed = line.trim();
                // Check for pip install commands (standard or Notebook style)
                if (trimmed.startsWith('pip install') || trimmed.startsWith('!pip install')) {
                    let cmd = trimmed.startsWith('!') ? trimmed.substring(1) : trimmed;

                    // OPTIMIZATION: Use CPU-only PyTorch to prevent 60s+ download times
                    if (cmd.includes('torch')) {
                        console.log("⚡ Optimizing PyTorch installation for CPU...");
                        cmd += ' --index-url https://download.pytorch.org/whl/cpu';
                    }
                    installCommands.push(cmd);
                } else {
                    pythonLines.push(line);
                }
            });

            // 2. Install dependencies (if any)
            if (installCommands.length > 0) {
                const installCmd = installCommands.join(' && ');
                console.log(`📦 Installing dependencies: ${installCmd}`);
                await sandbox.process.startAndWait({
                    cmd: installCmd,
                    onStdout: (data: any) => stdout.push(`[Install] ${data.line}`),
                    onStderr: (data: any) => stderr.push(`[Install] ${data.line}`),
                    timeout: 300000, // 5 mins
                } as any);
            }

            // 3. Write Python script to file (avoids quoting issues)
            const scriptPath = '/home/user/script.py';
            const cleanCode = pythonLines.join('\n');
            await (sandbox as any).filesystem.write(scriptPath, cleanCode);

            // 4. Execute the script
            const output = await sandbox.process.startAndWait({
                cmd: `python3 ${scriptPath}`,
                onStdout: (data: any) => stdout.push(data.line),
                onStderr: (data: any) => stderr.push(data.line),
                timeout: 300000, // 5 mins for execution
            } as any);

            await sandbox.close();

            return {
                stdout,
                stderr,
                exitCode: output.exitCode
            };
        } catch (error: any) {
            console.error("❌ E2B Execution Error:", error);
            // Return output captured so far plus error
            return {
                stdout,
                stderr,
                error: error.message || "Failed to execute code in sandbox"
            };
        }
    }

    /**
     * Provisions a long-running sandbox for a session
     */
    async createSession() {
        return await Sandbox.create({
            template: 'base',
            apiKey: process.env.E2B_API_KEY
        });
    }
}
