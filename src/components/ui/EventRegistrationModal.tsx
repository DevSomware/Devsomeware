"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
  useModal,
} from "../ui/animated-modal"; 
import { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
type EventRegistrationModalProps = {
  title: string;
  date: string;
  highlights: string[];
  icon: LucideIcon;
  users: {name:string,email:string};
  eventdata: {userid:string,eventid:string,eventname:string,ticketid:string,email:string,iszentrone:boolean};
};

export function EventRegistrationModal({
  title,
  date,
  highlights,
  icon: IconComponent,
  users,
  eventdata
}: EventRegistrationModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  console.log(users);
  const onConfirm = async() => {
    if(title=="ZeNoTronE Hackathon"){
    window.open("https://www.geeksforgeeks.org/");
    return;
    }
    try{
     setLoading(true);
     const senddata = await fetch("/api/event",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({id:users.id,eventid:"754293ssir",eventname:"zenetrone",email:users.email})
     })
      const data = await senddata.json();
      setLoading(false);
      if(data.success){
      toast.success(data.message);
      }
      else{
       toast.error(data.message); 
      }
    }
    catch(err){
      setLoading(false);
      console.log(err);
    }
  }
  return (
    <Modal>
      {/** Modal Trigger (the button that opens the modal) */}
      {users.name!=""&&eventdata.userid==undefined&&<ModalTrigger className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition">
        <div className="flex items-center gap-2">
          <IconComponent className="w-4 h-4" />
          
        <span>Register</span>
        </div>
      </ModalTrigger>}
      {
        users.name==""&&<div  className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition cursor-default"  onClick={()=>router.push('/login')}><div className="flex items-center justify-center gap-2">
        <IconComponent className="w-4 h-4" />
        
      <span>Login Now For Registration</span>
      </div>
      </div> 
      }
        {
        users.name!=""&&eventdata.userid!=undefined&&<div  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition cursor-default" ><div className="flex items-center justify-center gap-2">
        
        
      <span className="">Registered</span>
      </div>
      </div> 
      }
{
       title=="ZeNoTronE Hackathon"&&eventdata.userid!=undefined&&<div  className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition cursor-default"  onClick={()=> window.open("https://www.geeksforgeeks.org/")}><div className="flex items-center justify-center gap-2">
        <IconComponent className="w-4 h-4" />
        
      <span>Register Now</span>
      </div>
      </div> 
      }
      {/** The main body of the modal, shown when open = true */}
      <ModalBody>
      <ModalContent className="text-gray-800 dark:text-gray-100 text-left">
  <h2 className="text-xl font-bold mb-2">{title}</h2>
  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
    <strong>Date:</strong> {date}
  </p>

          {!!highlights?.length && (
            <ul className="list-disc list-inside text-sm mb-6">
              {highlights.map((h, idx) => (
                <li key={idx}>{h}</li>
              ))}
            </ul>
          )}

          <p className="text-sm">
            Click <strong>Yes</strong> to confirm your participation in{" "}
            <em>{title}</em>.
          </p>
        </ModalContent>

        <ModalFooter className="flex gap-4 justify-end">
          <NoButton />
          <YesButton onConfirm={onConfirm} title={title} loading={loading}/>
        </ModalFooter>
      </ModalBody>
    </Modal>
  );
}

function NoButton() {
  const { setOpen } = useModal();

  const handleNo = () => {
    console.log("User clicked NO");
    setOpen(false);
  };

  return (
    <button
      onClick={handleNo}
      className="px-3 py-1 rounded-md border border-gray-400 
                 dark:border-gray-600 text-sm"
    >
      No
    </button>
  );
}

function YesButton({ onConfirm, title ,loading}: { onConfirm?: () => void; title: string,loading:boolean }) {
  const { setOpen } = useModal();

  const handleYes = async() => {
    console.log(`User clicked YES for "${title}"`);
    if (onConfirm) {
      await onConfirm();
    }
    setOpen(false);
  };

  return (
    <button
      onClick={handleYes}
      className="px-3 py-1 rounded-md border border-black bg-black text-white 
                 dark:border-white dark:bg-white dark:text-black text-sm"
    >
      {loading?"Registering...":"Yes"}
    </button>
  );
}
