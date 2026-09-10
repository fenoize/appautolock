-- Operador: puede actualizar OTs de su branch (cambio de estado, asignación de técnico, etc.)
CREATE POLICY "Operador: actualiza OTs de su branch"
ON public.work_orders
FOR UPDATE
TO public
USING (
  has_role(auth.uid(), 'operador'::app_role)
  AND branch_id = get_user_branch(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'operador'::app_role)
  AND branch_id = get_user_branch(auth.uid())
);

-- Operador: puede insertar OTs en su branch (crear OT desde cotización, etc.)
CREATE POLICY "Operador: inserta OTs en su branch"
ON public.work_orders
FOR INSERT
TO public
WITH CHECK (
  has_role(auth.uid(), 'operador'::app_role)
  AND branch_id = get_user_branch(auth.uid())
);