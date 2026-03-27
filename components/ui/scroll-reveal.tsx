"use client";

import React, { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface ScrollRevealProps {
    children: ReactNode;
    delay?: number;
    duration?: number;
    y?: number;
    staggerChildren?: number;
    className?: string;
    once?: boolean;
}

/**
 * ScrollReveal - The "Wow" Multiplier
 * A standardized entrance animation for content blocks.
 * Uses spring physics for a premium, tactile feel.
 */
export function ScrollReveal({
    children,
    delay = 0,
    duration = 0.6,
    y = 30,
    staggerChildren,
    className,
    once = true,
}: ScrollRevealProps) {
    const shouldReduceMotion = useReducedMotion();

    // Premium Spring Physics from Audit
    const springTransition: any = {
        type: "spring",
        stiffness: 100,
        damping: 20,
        mass: 1,
        delay,
        duration: shouldReduceMotion ? 0 : duration,
    };

    const containerVariants = {
        hidden: {
            opacity: 0,
            y: shouldReduceMotion ? 0 : y
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                ...springTransition,
                staggerChildren: staggerChildren,
            },
        },
    };

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once, margin: "-50px" }}
            variants={containerVariants}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/**
 * ScrollRevealItem - For staggered children within a ScrollReveal container
 */
export function ScrollRevealItem({ children, className }: { children: ReactNode; className?: string }) {
    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 20,
            } as any
        },
    };

    return (
        <motion.div variants={itemVariants} className={className}>
            {children}
        </motion.div>
    );
}
