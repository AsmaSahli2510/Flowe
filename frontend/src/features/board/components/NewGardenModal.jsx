import { motion, AnimatePresence } from 'motion/react';
import { Leaf } from 'lucide-react';
import logo from '../../../assets/images/logoTransparent.png';

export default function NewGardenModal({newGardenOpen, setNewGardenOpen, plantGarden, newGardenName, setNewGardenName}) {
  return (
<AnimatePresence>
        {newGardenOpen && (
          <motion.div
            className="fw-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) =>
              event.target === event.currentTarget && setNewGardenOpen(false)
            }
          >
            <motion.form
              className="fw-seed-modal"
              onSubmit={plantGarden}
              initial={{ opacity: 0, scale: 0.9, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
            >
              <div className="fw-seed-illustration">
                <span />
                <span />
                <span />
                <img src={logo} alt="" width="42" height="42" />
              </div>
              <span className="fw-modal-kicker">Plant a garden</span>
              <h2>What are you growing next?</h2>
              <p>
                Give the project a name. Flowe will prepare clean soil for it.
              </p>
              <input
                autoFocus
                value={newGardenName}
                onChange={(event) => setNewGardenName(event.target.value)}
                placeholder="e.g. Final year project"
              />
              <div>
                <button type="button" onClick={() => setNewGardenOpen(false)}>
                  Cancel
                </button>
                <button className="fw-solid-button" type="submit">
                  Plant garden <Leaf size={15} />
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
  );
}
