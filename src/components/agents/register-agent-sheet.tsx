import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function RegisterAgentSheet({ children }: { children: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Enregistrer un nouvel agent</SheetTitle>
          <SheetDescription>
            Ajoutez un nouvel agent à la brigade. Remplissez les détails ci-dessous.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 py-6">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nom et Prénom
            </Label>
            <Input id="name" placeholder="Alex Johnson" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="matricule" className="text-right">
              Matricule
            </Label>
            <Input
              id="matricule"
              placeholder="E-B-007"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="grade" className="text-right">
              Grade
            </Label>
            <Input
              id="grade"
              placeholder="Capitaine"
              className="col-span-3"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contact" className="text-right">
              Contact
            </Label>
            <Input
              id="contact"
              placeholder="+33 1 23 45 67 89"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Adresse
            </Label>
            <Input id="address" placeholder="123 Rue de la Mission, Paris" className="col-span-3" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit">Sauvegarder l'agent</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
