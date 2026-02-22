import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, XCircle, Info, BellRing } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        let Icon = Info;
        if (variant === 'destructive') Icon = XCircle;
        else if (variant === 'success' || (typeof title === 'string' && title.toLowerCase().includes('success'))) Icon = CheckCircle2;
        else if (typeof title === 'string' && title.toLowerCase().includes('received')) Icon = BellRing;
        else if (typeof title === 'string' && title.toLowerCase().includes('confirm')) Icon = CheckCircle2;

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex gap-3 items-center w-full relative">
               <div className="shrink-0 flex items-center justify-center">
                  {variant === 'destructive' ? (
                     <div className="bg-[#5c2a2a] p-2.5 rounded-xl text-red-400 border border-red-500/20">
                        <Icon strokeWidth={2.5} className="h-6 w-6" />
                     </div>
                  ) : variant === 'success' || (typeof title === 'string' && (title.toLowerCase().includes('success') || title.toLowerCase().includes('confirm'))) ? (
                     <div className="bg-[#60B95C] p-2.5 rounded-xl text-white border border-[#76d872]/20">
                        <Icon strokeWidth={2.5} className="h-6 w-6" />
                     </div>
                  ) : typeof title === 'string' && title.toLowerCase().includes('received') ? (
                     <div className="bg-[#60B95C] p-2.5 rounded-xl text-white border border-[#76d872]/20">
                        <Icon strokeWidth={2.5} className="h-6 w-6" />
                     </div>
                  ) : (
                     <div className="bg-[#3a3a3a] p-2.5 rounded-xl text-white/80 border border-white/5">
                        <Icon strokeWidth={2.5} className="h-6 w-6" />
                     </div>
                  )}
               </div>
               
               <div className="flex-1 min-w-0 flex flex-col justify-center relative pt-0.5">
                 <div className="flex justify-between items-baseline mb-0.5">
                    {title && <ToastTitle className="text-[15px] p-0 m-0 font-medium tracking-tight text-white/95 truncate pr-8">{title}</ToastTitle>}
                    <span className="text-[10px] text-white/40 absolute right-0 top-0 pr-1 tracking-wider">Just now</span>
                 </div>
                 {description && (
                   <ToastDescription className="text-white/60 text-[12px] leading-[1.3] m-0 p-0 pr-2 line-clamp-2">
                      {description}
                   </ToastDescription>
                 )}
               </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
