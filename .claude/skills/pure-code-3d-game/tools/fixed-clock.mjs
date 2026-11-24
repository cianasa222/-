export function makeFixedClock({step=1/60,maxSteps=8,maxFrame=.25}={}){
 if(!Number.isFinite(step)||step<=0||!Number.isInteger(maxSteps)||maxSteps<1||!Number.isFinite(maxFrame)||maxFrame<=0)throw Error("invalid clock");
 let acc=0,tick=0,dropped=0;
 return {advance(frameSeconds,simulate){if(!Number.isFinite(frameSeconds)||frameSeconds<0||typeof simulate!=="function")throw Error("invalid frame");const dt=Math.min(frameSeconds,maxFrame);dropped+=frameSeconds-dt;acc+=dt;let steps=0;while(acc+step*1e-9>=step&&steps<maxSteps){simulate(step,tick);tick++;steps++;acc=Math.max(0,acc-step);}if(acc>=step){const skip=Math.floor(acc/step)*step;acc-=skip;dropped+=skip;}return {tick,steps,alpha:acc/step,droppedSeconds:dropped};}};
}
