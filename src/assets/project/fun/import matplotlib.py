import matplotlib.pyplot as plt
from matplotlib.sankey import Sankey

# --- Numbers from your table ---
P_stack = 50.0              # kW DC into stack
P_H2 = 34.5                 # kW chemical (HHV)
P_stack_heat = 15.5         # kW heat in stack

P_pump_feed = 0.011
P_pump_DI = 0.0015
P_TSA_heater = 0.5
P_cool_pump = 0.12
P_chiller = 5.17
P_compressor = 2.6

P_BoP = (P_pump_feed + P_pump_DI + P_TSA_heater +
         P_cool_pump + P_chiller + P_compressor)

# Transformer + rectifier losses
P_elec_losses = 0.515 + 1.02   # kW
P_grid = P_stack + P_BoP + P_elec_losses

print("BoP power:", P_BoP, "kW")
print("Electronics losses:", P_elec_losses, "kW")
print("Grid power:", P_grid, "kW")

fig = plt.figure(figsize=(12, 10))

# 1) Grid -> Stack + BoP + Power electronics losses
ax1 = fig.add_subplot(3, 1, 1)
sankey1 = Sankey(ax=ax1, unit=' kW', scale=0.01, gap=0.7, format='%.1f')
sankey1.add(
    flows=[P_grid, -P_stack, -P_BoP, -P_elec_losses],
    labels=['Grid electricity', 'Stack DC power',
            'BoP electrical loads', 'Power electronics losses'],
    orientations=[0, 0, -1, 1],
    pathlengths=[0.25, 0.25, 0.25, 0.25]
)
sankey1.finish()
ax1.set_title("Overall electrical input split", pad=20)

# 2) Stack DC -> H2 + stack heat
ax2 = fig.add_subplot(3, 1, 2)
sankey2 = Sankey(ax=ax2, unit=' kW', scale=0.015, gap=0.7, format='%.1f')
sankey2.add(
    flows=[P_stack, -P_H2, -P_stack_heat],
    labels=['Stack DC power', 'H$_2$ chemical energy', 'Heat in stack'],
    orientations=[0, 0, -1],
    pathlengths=[0.25, 0.25, 0.25]
)
sankey2.finish()
ax2.set_title("Stack energy split (HHV basis)", pad=20)

# 3) BoP -> individual components
ax3 = fig.add_subplot(3, 1, 3)
sankey3 = Sankey(ax=ax3, unit=' kW', scale=0.5, gap=0.7, format='%.2f')
sankey3.add(
    flows=[P_BoP, -P_pump_feed, -P_pump_DI, -P_TSA_heater,
           -P_cool_pump, -P_chiller, -P_compressor],
    labels=[
        'BoP electrical loads',
        'Feed water pump',
        'DI pump', 
        'TSA heater',
        'Cooling pump',
        'Chiller',
        'H$_2$ compressor'
    ],
    orientations=[0, 1, -1, 1, -1, 0, 0],
    pathlengths=[0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25]
)
sankey3.finish()
ax3.set_title("Breakdown of BoP electrical consumption", pad=20)

plt.tight_layout(pad=3.0)
plt.show()
