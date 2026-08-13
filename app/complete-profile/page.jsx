"use client";

import {useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import {supabase} from "@/services/supabaseClient.ts";

export default function CompleteProfilePage(){
    const router = useRouter();

    const [checking, setChecking] = useState(true);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [address, setAddress] = useState("");

    const[error, setError] = useState(null);
    const[saving, setSaving] = useState(false);

    useEffect(()=>{
        async function loadProfile(){
            const {data: userData} = await supabase.auth.getUser();

            if (!userData.user){
                router.push("/login");
                return;
            }

            const {data: customerRow, error: fetchError} = await supabase.from("customer").select("first_name, last_name, phone_number, address").eq("user_id", userData.user.id).single();

            if (fetchError){
                setError(fetchError.message);
                setChecking(false);
                return;
            }

            if (
                customerRow.first_name &&
                customerRow.last_name && 
                customerRow.phone_number &&
                customerRow.address
            ){
                router.push("/dashboard/customer");
            }

            setFirstName(customerRow.first_name ?? "");
            setLastName(customerRow.last_name ?? "");
            setPhoneNumber(customerRow.phone_number ?? "");
            setAddress(customerRow.address ?? "");
            setChecking(false);
        }

        loadProfile();
    }, [router]);

    async function handleSave(e){
    e.preventDefault();
    setError(null);
    setSaving(true);

    const {data: userData}= await supabase.auth.getUser();

    const {error: updateError} = await supabase.from("customer").update({
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        address: address,
    }).eq("user_id", userData.user.id);

    setSaving(false);

    if(updateError){
        setError(updateError.message);
        return;
    }

    router.push("/dashboard/customer");
    }

    if(checking){    
        return <p>Loading...</p>;
    }

    return(
    <main className="mgh-auth-page">
        <section className="mgh-auth-right" style={{gridColumn: "1/ -1"}}>
            <div className="mgh-auth-box">
            <h2>Complete Your Profile</h2>

            <form className="mgh-auth-form" onSubmit={handleSave}>
                <div className="mgh-input-box no-icon">
                    <input type="text"
                    placeholder="Fist Name" 
                    required 
                    value={firstName} 
                    onChange={(e)=> setFirstName(e.target.value)}/>
                </div>

                <div className="mgh-input-box no-icon">
                    <input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e)=> setLastName(e.target.value)}
                    />
                </div>

                <div className="mgh-input-box no-icon">
                    <input
                    type="text"
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChange={(e)=> setPhoneNumber(e.target.value)}
                    />
                </div>

                <div className="mgh-input-box no-icon">
                    <input
                    type="text"
                    placeholder="Address"
                    value={address}
                    onChange={(e)=> setAddress(e.target.value)}
                    />
                </div>

                {error && <p className="mgh-auth-error">{error}</p>}

                <button type="submit"
                className="mgh-auth-main-btn" disabled={saving}
                > {saving ? "SAVING...": "CONTINUE"}</button>
            </form>
            </div>
        </section>
    </main>
    );
}