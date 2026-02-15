import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';


export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });
    
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#FFF8E7]">
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    <div className="space-y-2">
                        <div className="text-6xl mb-2">🐥</div>
                        <h1 className="text-6xl font-bold text-[#FFE66D]">404</h1>
                    </div>
                    
                    <div className="space-y-3">
                        <h2 className="text-2xl font-bold text-[#2D3436]">
                            Oops! Page Not Found
                        </h2>
                        <p className="text-[#2D3436]/60 leading-relaxed">
                            Looks like this little ducky wandered off! The page <span className="font-semibold text-[#FFB347]">"{pageName}"</span> doesn't exist.
                        </p>
                    </div>
                    
                    <div className="pt-6">
                        <button 
                            onClick={() => window.location.href = '/'} 
                            className="inline-flex items-center px-6 py-3 text-sm font-bold text-[#2D3436] bg-[#FFE66D] rounded-2xl hover:bg-[#FFD93D] transition-colors shadow-md shadow-[#FFE66D]/30"
                        >
                            🏠 Waddle Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}