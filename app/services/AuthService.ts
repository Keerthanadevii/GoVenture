
// Mock Auth Service to simulate backend behavior
class MockAuthService {
    private static users = new Set<string>();

    // Simulate network delay
    private static async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static async signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
        await this.delay(1000);

        const normalizedEmail = email.toLowerCase().trim();

        // Mock check: "existing@gmail.com" already exists, or strictly check our in-memory set
        if (normalizedEmail === 'test@gmail.com' || this.users.has(normalizedEmail)) {
            return { success: false, error: "Account already exists with this email." };
        }

        this.users.add(normalizedEmail);
        return { success: true };
    }

    static async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
        await this.delay(1000);

        const normalizedEmail = email.toLowerCase().trim();

        // Allow 'test@gmail.com' or any user created in this session
        if (normalizedEmail === 'test@gmail.com' || this.users.has(normalizedEmail)) {
            return { success: true };
        }

        return { success: false, error: "Account doesn't exist. Please sign up." };
    }
}

export default MockAuthService;
