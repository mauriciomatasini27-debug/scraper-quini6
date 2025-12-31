'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type { Combinacion } from '../../types';

interface JuezFinalCardProps {
  combinacion: Combinacion;
  posicion: 1 | 2 | 3;
  razon?: string;
  delay?: number;
}

const posicionConfig = {
  1: {
    emoji: '🥇',
    gradient: 'from-yellow-500/20 to-yellow-600/10',
    border: 'border-yellow-500/30',
    title: 'Primera Recomendación',
  },
  2: {
    emoji: '🥈',
    gradient: 'from-gray-400/20 to-gray-500/10',
    border: 'border-gray-400/30',
    title: 'Segunda Recomendación',
  },
  3: {
    emoji: '🥉',
    gradient: 'from-amber-600/20 to-amber-700/10',
    border: 'border-amber-600/30',
    title: 'Tercera Recomendación',
  },
};

export function JuezFinalCard({
  combinacion,
  posicion,
  razon,
  delay = 0,
}: JuezFinalCardProps) {
  const config = posicionConfig[posicion];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card
        className={`
          relative overflow-hidden border-2 transition-all hover:scale-[1.02] hover:shadow-lg
          ${config.border} bg-gradient-to-br ${config.gradient}
        `}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{config.emoji}</span>
              <span>{config.title}</span>
            </CardTitle>
            <div className="text-xs text-muted-foreground">#{posicion}</div>
          </div>
          <CardDescription>
            {razon || 'Combinación seleccionada por el Juez Final (IA)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 justify-center">
            {combinacion.map((numero, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + index * 0.05 }}
                className={`
                  flex h-14 w-14 items-center justify-center rounded-lg
                  bg-primary/20 text-lg font-bold text-primary
                  border border-primary/30 shadow-sm
                  transition-all hover:scale-110 hover:bg-primary/30
                `}
              >
                {numero.toString().padStart(2, '0')}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

