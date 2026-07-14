import { useState } from "react";
import { toast } from "react-toastify";
import api from "../../lib/api";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await api.post("/accounts/forgotPassword/", { email });
            if (response.data.success) {
                toast.success(response.data.message || "Reset link sent to your email!");
            } else {
                toast.error(response.data.message || "Failed to send reset link.");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="w-fit px-6">
                <h1 className="text-[40px] font-semibold text-center mb-3">
                    Forgot your password?
                </h1>

                <p className="text-xl text-center text-gray-600 mb-6">
                    Please enter your email and we will send you a <br /> link reset your password
                </p>

                <form onSubmit={handleSubmit} className="space-y-10">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Email<span className="text-[16px] text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="myname@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded-md py-3 px-5 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white font-medium py-4 px-5 rounded-md hover:bg-blue-700 transition-all cursor-pointer disabled:bg-blue-300"
                    >
                        {isLoading ? "Submitting..." : "Submit"}
                    </button>


                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
