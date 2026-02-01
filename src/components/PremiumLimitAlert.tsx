import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Crown, ArrowRight } from 'lucide-react';

interface PremiumLimitAlertProps {
  type: 'group' | 'event';
  currentCount: number;
  maxCount: number;
}

export function PremiumLimitAlert({ type, currentCount, maxCount }: PremiumLimitAlertProps) {
  const isGroup = type === 'group';

  return (
    <Alert className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
      <Crown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      <AlertTitle className="text-orange-900 dark:text-orange-100">
        Limite atteinte ({currentCount}/{maxCount})
      </AlertTitle>
      <AlertDescription className="text-orange-800 dark:text-orange-200">
        <p className="mb-3">
          {isGroup
            ? 'Vous avez atteint la limite de groupe pour la version gratuite. Passez à Premium pour créer des groupes illimités.'
            : `Vous avez créé ${currentCount} événements cette année (limite: ${maxCount}). Passez à Premium pour des événements illimités.`
          }
        </p>
        <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700">
          <Link to="/pricing">
            Découvrir Premium
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
