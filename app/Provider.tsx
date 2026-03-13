'use client';

import { useEffect, useState } from 'react'
import axios from 'axios';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { UserDetailContext } from '@/context/userDetailContext';

function Provider( { children }: { children: React.ReactNode } ) {
    const { user } = useUser();
    const pathname = usePathname();
    const [userDetail, setUserDetail] = useState();

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        user && CreateNewUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => {
        if (!user || !pathname?.startsWith('/dashboard')) {
            return;
        }

        let isCancelled = false;

        const autoSignInToPuter = async () => {
            try {
                const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
                const sessionKey = email
                    ? `puter:auto-signin:${email}`
                    : 'puter:auto-signin:anonymous';

                if (sessionStorage.getItem(sessionKey) === 'done') {
                    return;
                }

                const { default: puter } = await import('@heyputer/puter.js');

                if (puter.auth.isSignedIn()) {
                    sessionStorage.setItem(sessionKey, 'done');
                    return;
                }

                await puter.auth.signIn();

                if (!isCancelled) {
                    sessionStorage.setItem(sessionKey, 'done');
                }
            } catch (error) {
                console.error('Puter auto sign-in failed', error);
            }
        };

        void autoSignInToPuter();

        return () => {
            isCancelled = true;
        };
    }, [pathname, user]);

    const CreateNewUser = async () => {
        const result = await axios.post('/api/user', {
            name: user?.fullName,
            email: user?.primaryEmailAddress?.emailAddress,
            imageUrl: user?.imageUrl,
            phoneNumber: user?.primaryPhoneNumber?.phoneNumber ?? null,
        });
        setUserDetail(result.data);
    }

    return (
        <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
            <div>
                {children}
            </div>
        </UserDetailContext.Provider>
    )
}

export default Provider;
