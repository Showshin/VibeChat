import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { userApi } from '../api/firebaseApi';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState(null);
    const userListenerUnsubscribe = useRef(null);

    // Theo dõi trạng thái auth và lấy thông tin user
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                try {
                    // Hủy listener cũ nếu có
                    if (userListenerUnsubscribe.current) {
                        userListenerUnsubscribe.current();
                    }

                    // Thiết lập real-time listener mới
                    userListenerUnsubscribe.current = userApi.listenToUserInfo(user.uid, (userData) => {
                        if (userData) {
                            setUserInfo(userData);
                        }
                    });

                    // Set user status to online
                    const userRef = doc(db, 'Users', user.uid);
                    await updateDoc(userRef, {
                        status: 'online',
                        lastSeen: serverTimestamp()
                    });
                    console.log("User status set to online in AuthContext", user.uid);

                } catch (error) {
                    console.error('Error setting up user listener:', error);
                }
            } else {
                // Cleanup listener when user logs out
                if (userListenerUnsubscribe.current) {
                    userListenerUnsubscribe.current();
                    userListenerUnsubscribe.current = null;
                }
                setUserInfo(null);
            }

            setLoading(false);
        });

        return () => {
            unsubscribe();
            // Cleanup listener on component unmount
            if (userListenerUnsubscribe.current) {
                userListenerUnsubscribe.current();
            }
        };
    }, []);

    // Hàm cập nhật thông tin người dùng
    const updateUserInfo = (newUserInfo) => {
        setUserInfo(newUserInfo);
    };

    // Hàm đăng xuất
    const logout = async () => {
        if (currentUser && currentUser.uid) {
            try {
                const userRef = doc(db, 'Users', currentUser.uid);
                await updateDoc(userRef, {
                    status: 'offline',
                    lastSeen: serverTimestamp()
                });
                console.log("User status set to offline in AuthContext before sign out", currentUser.uid);
            } catch (dbError) {
                console.error("Error updating user status to offline:", dbError);
                // Log the error, but proceed with logout
            }
        }
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const value = {
        currentUser,
        userInfo,
        updateUserInfo,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
} 