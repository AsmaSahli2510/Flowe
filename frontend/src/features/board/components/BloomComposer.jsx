import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';
import logo from '../../../assets/images/logoTransparent.png';
import { PETAL_POSITIONS, VIEW_META } from '../constants/workspace';

export default function BloomComposer({bloomOpen, gardenPetals, pulse, setBloomOpen, activeCount}) {
  return (
<div className={`fw-bloom-zone ${bloomOpen ? "open" : ""}`}>
        <motion.div
          className="fw-bloom-halo"
          animate={
            bloomOpen
              ? { scale: 1.12, opacity: 0.9 }
              : { scale: 0.78, opacity: 0.35 }
          }
          transition={{ duration: 0.35 }}
        />
        {gardenPetals.map((petal, index) => {
          const Icon = petal.Icon;
          const position = PETAL_POSITIONS[index];
          return (
            <motion.button
              key={petal.id}
              className={`fw-bloom-petal petal-${petal.color} ${petal.active ? "active" : ""}`}
              style={{
                "--petal-tilt": `${position.rotate}deg`,
                "--petal-delay": `${index * 80}ms`,
              }}
              aria-label={petal.label}
              title={petal.label}
              onClick={petal.onClick}
              initial={false}
              animate={
                bloomOpen
                  ? {
                      x: position.x,
                      y: position.y,
                      rotate: position.rotate,
                      scale: 1,
                      opacity: 1,
                    }
                  : {
                      x: 0,
                      y: -10,
                      rotate: position.rotate * 0.08,
                      scale: 0.16,
                      opacity: 0,
                    }
              }
              transition={{
                type: "spring",
                stiffness: 250,
                damping: 19,
                mass: 0.76,
                delay: bloomOpen ? position.delay : 0,
              }}
              whileHover={{ scale: bloomOpen ? 1.045 : 0.2 }}
              whileTap={{ scale: 0.94 }}
            >
              <span className="fw-petal-surface">
                <span className="fw-petal-vein" />
                <span className="fw-petal-icon">
                  <Icon size={19} />
                </span>
              </span>
              <span className="fw-petal-label">
                <strong>{petal.label}</strong>
                <small>
                  {petal.id === "garden"
                    ? "Choose a garden"
                    : VIEW_META[petal.id]?.note}
                </small>
              </span>
              {petal.active && (
                <span className="fw-petal-check">
                  <Check size={11} />
                </span>
              )}
            </motion.button>
          );
        })}
        <motion.button
          key={pulse}
          className="fw-bloom-core"
          onClick={() => setBloomOpen((value) => !value)}
          aria-expanded={bloomOpen}
          aria-label="Toggle Flowe Bloom"
          initial={{ scale: 1 }}
          animate={
            bloomOpen
              ? { scale: 1, rotate: 0 }
              : { scale: [1, 1.04, 1], rotate: [0, -2, 0] }
          }
          transition={{ type: "tween", duration: 0.45, ease: "easeInOut" }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
        >
          <span className="fw-core-shine" />
          <img src={logo} alt="" />
          <span className="fw-core-count">{activeCount}</span>
        </motion.button>
        <AnimatePresence>
          {bloomOpen && (
            <motion.div
              className="fw-bloom-caption"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
            >
              compose your bloom
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}
