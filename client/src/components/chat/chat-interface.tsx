import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Send, FilePlus, Phone, Video, MoreVertical } from "lucide-react";

const CONTACTS = [
  { id: 1, name: "Global Agritech Support", avatar: "", lastMessage: "Yes, the LC has been issued.", time: "10:42 AM", unread: 2 },
  { id: 2, name: "Acme Logistics", avatar: "", lastMessage: "Container 50 is boarding now.", time: "Yesterday", unread: 0 },
  { id: 3, name: "Vanguard Trade Finance", avatar: "", lastMessage: "We can offer a 2% rate on this.", time: "Tuesday", unread: 0 },
];

const MESSAGES = [
  { id: 1, senderId: 1, text: "Hello! We are reviewing your recent PGA structure.", time: "10:30 AM" },
  { id: 2, senderId: 'me', text: "Great, let me know if you need the Bill of Lading.", time: "10:35 AM" },
  { id: 3, senderId: 1, text: "Wait, actually yes. Can you attach it here?", time: "10:40 AM" },
  { id: 4, senderId: 1, text: "Yes, the LC has been issued.", time: "10:42 AM" },
];

export function ChatInterface() {
  const [activeContact, setActiveContact] = useState(CONTACTS[0]);
  const [message, setMessage] = useState("");

  return (
    <div className="flex h-full w-full bg-background border-t border-border">
      
      {/* Sidebar: Contacts List */}
      <div className="w-80 border-r border-border flex flex-col bg-card/50 hidden md:flex">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search messages" className="pl-9 bg-muted/50 border-transparent rounded-full" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {CONTACTS.map(contact => (
            <button
              key={contact.id}
              onClick={() => setActiveContact(contact)}
              className={`w-full flex items-center gap-3 p-4 border-b border-border hover:bg-muted/50 transition-colors text-left ${activeContact.id === contact.id ? 'bg-primary/5' : ''}`}
            >
              <Avatar className="h-12 w-12 border border-border">
                <AvatarFallback>{contact.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm truncate">{contact.name}</span>
                  <span className="text-xs text-muted-foreground">{contact.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground truncate pr-2">{contact.lastMessage}</span>
                  {contact.unread > 0 && (
                    <span className="h-5 w-5 bg-primary rounded-full flex items-center justify-center text-[10px] text-primary-foreground font-bold">
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background relative">
        {/* Chat Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-4 sm:px-6 bg-card">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{activeContact.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-sm">{activeContact.name}</h2>
              <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 inline-block"></span> Online
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="text-center text-xs text-muted-foreground my-4">Today</div>
          {MESSAGES.map(msg => {
            const isMe = msg.senderId === 'me';
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl p-3 ${
                  isMe 
                    ? 'bg-primary text-primary-foreground rounded-br-sm' 
                    : 'bg-muted text-foreground rounded-bl-sm border border-border/50'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                  <span className={`text-[10px] mt-1 block ${isMe ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-left'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-card border-t border-border">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0">
              <FilePlus className="h-5 w-5" />
            </Button>
            <Input 
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your message..." 
              className="flex-1 rounded-full bg-muted/50 border-transparent"
            />
            <Button size="icon" className="shrink-0 rounded-full h-10 w-10">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}
