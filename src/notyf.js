//Notify class for specific errors
export class Notify {
    constructor() {
        this.notyf = null;
        this.initializeNotyf();
    }

    //promisify (initialize before the error called)
    async initializeNotyf() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                this.createNotyf();
                return resolve();
            } else {
                window.addEventListener('load', () => {
                    this.createNotyf();
                    return resolve();
                });
            }
        });
    }

    createNotyf() {
        this.notyf = new Notyf({
            duration: 3000,
            position: { x: "center", y: "top" },
            dismissible: true
        });
    }

    async success(message) {
        await this.initializeNotyf();
        this.notyf.success(message);
    }

    async error(message) {
        await this.initializeNotyf();
        this.notyf.error(message);
    }
}